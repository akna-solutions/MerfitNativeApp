import * as Network from "expo-network";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus, Linking, Platform } from "react-native";

import { isApiError, NetworkError } from "../../services/api/client";
import { getStepDay, getStepSettings, StepSettings, syncSteps } from "../../services/api/steps";
import { requestAchievementCheck } from "../achievements/useAchievementCelebration";
import { useAuth } from "../auth/AuthContext";
import { addDays, toDateKey } from "../calendar/dates";
import {
  coreMotionSource,
  getSensorPermission,
  readDayHourly,
  SensorStatus,
  SOURCE_KIND,
  supportsHistory,
  watchStepDeltas,
} from "./stepSensor";
import {
  addSteps,
  DEFAULT_STEP_SETTINGS,
  effectiveGoal,
  emptyHourly,
  emptyStepState,
  hourlySignature,
  KEEP_DAYS,
  LocalStepDay,
  markFinalized,
  markSynced,
  mergeDay,
  mergeHourly,
  pendingSyncDays,
  pruneDays,
  StepState,
  totalSteps,
  utcOffsetMinutes,
} from "./stepState";
import { loadStepState, saveStepState } from "./stepStorage";

/** Otomatik senkronizasyonlar arasi en kisa sure (on planda). */
export const SYNC_INTERVAL_MS = 15 * 60 * 1000;
/** Uygulama acilinca/one gelince, son senkronizasyondan bu kadar sure gectiyse senkronize edilir. */
export const FOREGROUND_SYNC_AFTER_MS = 5 * 60 * 1000;
/** Basarisiz senkronizasyondan sonra tekrar denemeden once beklenen en kisa sure. */
const RETRY_AFTER_MS = 60 * 1000;
const SAVE_DEBOUNCE_MS = 2000;
const TICK_MS = 60 * 1000;
const IOS_REFRESH_DEBOUNCE_MS = 3000;

export type StepCounterValue = {
  /** Sensor/izin durumu; "checking" ilk kontrol bitene kadar. */
  status: SensorStatus | "checking";
  /** Izin reddedildi ve sistem tekrar soramiyor: kullanici Ayarlar'a yonlendirilmeli. */
  mustOpenSettings: boolean;
  /** Yerel veri yuklendi mi (ilk acilista kart iskelet gosterir). */
  ready: boolean;
  todayKey: string;
  todaySteps: number;
  dailyGoal: number;
  settings: StepSettings;
  /** Son 8 yerel gun (sunucudan geri yuklenenler dahil). */
  days: Record<string, LocalStepDay>;
  /** Android'de uygulama kapaliyken adim alinamadigini aciklamak icin. */
  backgroundHistorySupported: boolean;
  lastSyncAt: number | null;
  /** Gonderilmeyi bekleyen adim verisi var (or. internet yok). */
  hasPendingSync: boolean;
  requestPermission: () => Promise<void>;
  openSettings: () => void;
  syncNow: () => Promise<void>;
};

const StepCounterContext = createContext<StepCounterValue | null>(null);

/**
 * Adim sayarin uygulama genelindeki durumu (bkz. _layout.tsx). Gorevleri:
 * - Sensor izni ve kullanilabilirligi.
 * - Adim toplama: iOS'ta CoreMotion gecmisi saat saat okunur (uygulama kapaliyken atilan adimlar dahil);
 *   Android'de yalnizca uygulama on plandayken canli sayac.
 * - Yerel kalici onbellek (uygulama kapanip acilinca/telefon yeniden baslayinca sayac sifirlanmaz).
 * - Seyrek ve idempotent senkronizasyon: uygulama acilinca, 15 dakikada bir, arka plana gecerken ve internet
 *   geri geldiginde; yalnizca degisen gunler gonderilir.
 */
export function StepCounterProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, username, sessionVersion } = useAuth();
  const signedIn = authStatus === "signedIn";

  const stateRef = useRef<StepState>(emptyStepState(null));
  const [snapshot, setSnapshot] = useState<StepState>(stateRef.current);
  const [ready, setReady] = useState(false);
  const [sensor, setSensor] = useState<{ status: SensorStatus | "checking"; canAskAgain: boolean }>({ status: "checking", canAskAgain: true });
  const [todayKey, setTodayKey] = useState(() => toDateKey(new Date()));
  const todayKeyRef = useRef(todayKey);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncing = useRef(false);
  const lastSyncAttempt = useRef(0);
  const appActive = useRef(AppState.currentState === "active");
  const stopWatch = useRef<(() => void) | null>(null);
  const iosRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasPendingSync, setHasPendingSync] = useState(false);

  const persist = useCallback((immediate = false) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (immediate) {
      saveTimer.current = null;
      void saveStepState(stateRef.current);
      return;
    }
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      void saveStepState(stateRef.current);
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const update = useCallback(
    (next: StepState, options: { immediate?: boolean } = {}) => {
      if (next === stateRef.current) return;
      stateRef.current = next;
      setSnapshot(next);
      setHasPendingSync(pendingSyncDays(next, new Date()).length > 0);
      persist(options.immediate);
    },
    [persist],
  );

  /** iOS: bugunun (ve henuz tamamlanmamis gecmis gunlerin) saatlik adimlarini CoreMotion'dan okur. */
  const refreshFromHistory = useCallback(
    async (includePastDays: boolean) => {
      if (!supportsHistory()) return;
      const now = new Date();
      try {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
        const readings: { key: string; hourly: number[]; finalize: boolean }[] = [];
        if (includePastDays) {
          // CoreMotion en fazla 7 gun saklar; bitmis ama henuz tam okunmamis gunler bir kez okunur.
          for (let i = KEEP_DAYS - 1; i >= 1; i--) {
            const day = addDays(today, -i);
            const key = toDateKey(day);
            if (stateRef.current.days[key]?.finalized) continue;
            readings.push({ key, hourly: await readDayHourly(coreMotionSource, day, now), finalize: true });
          }
        }
        readings.push({ key: toDateKey(today), hourly: await readDayHourly(coreMotionSource, today, now), finalize: false });
        // Okumalar surerken baska guncellemeler (or. senkronizasyon isareti) olmus olabilir; en guncel duruma uygulanir.
        let next = stateRef.current;
        for (const reading of readings) {
          next = mergeDay(next, reading.key, reading.hourly, utcOffsetMinutes(now));
          if (reading.finalize) next = markFinalized(next, reading.key);
        }
        update(next);
      } catch {
        // CoreMotion okunamadi (or. izin geri alindi); izin durumu bir sonraki kontrolde guncellenir.
      }
    },
    [update],
  );

  const scheduleIosRefresh = useCallback(() => {
    if (iosRefreshTimer.current) return;
    iosRefreshTimer.current = setTimeout(() => {
      iosRefreshTimer.current = null;
      void refreshFromHistory(false);
    }, IOS_REFRESH_DEBOUNCE_MS);
  }, [refreshFromHistory]);

  const stopTracking = useCallback(() => {
    stopWatch.current?.();
    stopWatch.current = null;
  }, []);

  const startTracking = useCallback(() => {
    if (stopWatch.current) return;
    try {
      stopWatch.current = watchStepDeltas((steps, at) => {
        if (supportsHistory()) {
          // iOS: canli olay yalnizca tetikleyicidir; deger CoreMotion'dan okunur (cift sayim olmaz).
          scheduleIosRefresh();
        } else {
          update(addSteps(stateRef.current, at, steps));
        }
      });
    } catch {
      stopWatch.current = null;
    }
  }, [scheduleIosRefresh, update]);

  const sync = useCallback(
    async (options: { force?: boolean } = {}) => {
      if (!signedIn || syncing.current) return;
      const now = Date.now();
      if (!options.force && now - lastSyncAttempt.current < RETRY_AFTER_MS) return;
      syncing.current = true;
      lastSyncAttempt.current = now;
      try {
        let state = stateRef.current;
        const days = pendingSyncDays(stateRef.current, new Date());
        if (days.length > 0) {
          const response = await syncSteps({
            days,
            source: SOURCE_KIND,
            platform: Platform.OS === "ios" ? "ios" : "android",
          });
          state = markSynced(stateRef.current, days, response.days, Date.now());
          update({ ...state, settings: response.settings }, { immediate: true });
          if (response.days.some((d) => d.status === "accepted")) {
            // Adim basarisi kazanilmis olabilir; kutlama bir sonraki ekran odaginda gosterilir.
            requestAchievementCheck();
          }
        } else if (!stateRef.current.settings || stateRef.current.settings.goalSource !== "auto") {
          // Hedef sunucuda profile gore belirlenir; eski surumden kalan (kullanicinin sectigi) hedef yenilenir.
          const settings = await getStepSettings();
          update({ ...stateRef.current, settings });
        }
      } catch (error) {
        // Ag yoksa veri cihazda kalir; internet geldiginde / bir sonraki tetikte tekrar denenir.
        if (!(error instanceof NetworkError) && !(isApiError(error) && error.status === 401)) {
          console.warn("[Adım sayar] Senkronizasyon başarısız:", error);
        }
      } finally {
        syncing.current = false;
      }
    },
    [signedIn, update],
  );

  const checkPermission = useCallback(async (request: boolean) => {
    const permission = await getSensorPermission(request);
    setSensor(permission);
    return permission.status;
  }, []);

  // Oturum acilinca: yerel veriyi yukle, sunucudan bugunu geri yukle (uygulama yeniden kurulduysa), izni kontrol et.
  useEffect(() => {
    if (!signedIn) {
      stopTracking();
      setReady(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const stored = await loadStepState();
      if (cancelled) return;
      let state = stored ?? emptyStepState(username);
      if (username && state.owner && state.owner !== username) {
        state = emptyStepState(username);
      } else if (username && !state.owner) {
        state = { ...state, owner: username };
      }
      state = pruneDays(state, new Date());
      stateRef.current = state;
      setSnapshot(state);
      setHasPendingSync(pendingSyncDays(state, new Date()).length > 0);
      setReady(true);

      const status = await checkPermission(false);
      if (cancelled) return;

      // Sunucudaki bugun/dun verisi yerel veriyle "buyuk olan kalir" kuraliyla birlesir; boylece uygulama
      // silinip kurulsa da (Android'de canli sayac sifirdan baslar) gun icindeki adimlar kaybolmaz.
      try {
        const now = new Date();
        for (const day of [addDays(now, -1), now]) {
          const key = toDateKey(day);
          const remote = await getStepDay(key);
          if (cancelled) return;
          if (remote.hasData && remote.hourlySteps) {
            let next = mergeDay(stateRef.current, key, remote.hourlySteps, utcOffsetMinutes(now));
            const merged = next.days[key]?.hourly;
            if (merged && hourlySignature(merged) === hourlySignature(mergeHourly(remote.hourlySteps, undefined))) {
              // Yerel veri sunucudakiyle ayni: tekrar gonderilmesine gerek yok.
              next = { ...next, synced: { ...next.synced, [key]: hourlySignature(merged) } };
            }
            update(next);
          }
        }
      } catch {
        // Cevrimdisi: yerel veriyle devam edilir.
      }

      if (status === "granted" && appActive.current) {
        startTracking();
        await refreshFromHistory(true);
      }
      await sync({ force: true });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, sessionVersion]);

  // On plan / arka plan gecisleri.
  useEffect(() => {
    if (!signedIn) return;
    const onChange = (next: AppStateStatus) => {
      const wasActive = appActive.current;
      appActive.current = next === "active";
      if (next === "active" && !wasActive) {
        todayKeyRef.current = toDateKey(new Date());
        setTodayKey(todayKeyRef.current);
        void (async () => {
          // Kullanici Ayarlar'dan izni acip donmus olabilir.
          const status = await checkPermission(false);
          if (status === "granted") {
            startTracking();
            await refreshFromHistory(true);
          }
          const last = stateRef.current.lastSyncAt ?? 0;
          if (Date.now() - last > FOREGROUND_SYNC_AFTER_MS) await sync({ force: true });
        })();
      } else if (next !== "active" && wasActive) {
        // Android: arka planda olay gelmez; donuste birikmis deger tek saate yazilmasin diye abonelik kapatilir.
        stopTracking();
        persist(true);
        void sync({ force: true });
      }
    };
    const subscription = AppState.addEventListener("change", onChange);
    return () => subscription.remove();
  }, [signedIn, checkPermission, startTracking, stopTracking, refreshFromHistory, sync, persist]);

  // Dakikalik tik: gun degisimi (yerel gece yarisi / saat dilimi degisimi) ve periyodik senkronizasyon.
  useEffect(() => {
    if (!signedIn) return;
    const id = setInterval(() => {
      if (!appActive.current) return;
      const now = new Date();
      const key = toDateKey(now);
      if (todayKeyRef.current !== key) {
        // Yerel gece yarisi (ya da saat dilimi degisimi): yeni gun bos kovayla baslar, onceki gun korunur.
        todayKeyRef.current = key;
        setTodayKey(key);
        update(pruneDays(stateRef.current, now));
        void refreshFromHistory(true);
      }
      if (supportsHistory() && stopWatch.current) void refreshFromHistory(false);
      const last = stateRef.current.lastSyncAt ?? 0;
      if (Date.now() - last > SYNC_INTERVAL_MS) void sync();
    }, TICK_MS);
    return () => clearInterval(id);
  }, [signedIn, refreshFromHistory, sync, update]);

  // Internet geri geldiginde bekleyen veri gonderilir.
  useEffect(() => {
    if (!signedIn || Platform.OS === "web") return;
    let subscription: { remove: () => void } | null = null;
    try {
      subscription = Network.addNetworkStateListener((state) => {
        const current = stateRef.current;
        const pending = pendingSyncDays(current, new Date()).length > 0;
        if (state.isConnected && state.isInternetReachable !== false && pending) {
          void sync({ force: true });
        }
      });
    } catch {
      subscription = null;
    }
    return () => subscription?.remove();
  }, [signedIn, sync]);

  useEffect(
    () => () => {
      stopTracking();
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        void saveStepState(stateRef.current);
      }
      if (iosRefreshTimer.current) clearTimeout(iosRefreshTimer.current);
    },
    [stopTracking],
  );

  const requestPermission = useCallback(async () => {
    const status = await checkPermission(true);
    if (status === "granted") {
      startTracking();
      await refreshFromHistory(true);
      await sync({ force: true });
    }
  }, [checkPermission, startTracking, refreshFromHistory, sync]);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const syncNow = useCallback(() => sync({ force: true }), [sync]);

  const value = useMemo<StepCounterValue>(() => {
    const today = snapshot.days[todayKey];
    return {
      status: sensor.status,
      mustOpenSettings: sensor.status === "denied" && !sensor.canAskAgain,
      ready,
      todayKey,
      todaySteps: totalSteps(today?.hourly),
      dailyGoal: effectiveGoal(snapshot),
      settings: snapshot.settings ?? DEFAULT_STEP_SETTINGS,
      days: snapshot.days,
      backgroundHistorySupported: supportsHistory(),
      lastSyncAt: snapshot.lastSyncAt,
      hasPendingSync,
      requestPermission,
      openSettings,
      syncNow,
    };
  }, [snapshot, todayKey, sensor, ready, hasPendingSync, requestPermission, openSettings, syncNow]);

  return <StepCounterContext.Provider value={value}>{children}</StepCounterContext.Provider>;
}

export function useStepCounter(): StepCounterValue {
  const ctx = useContext(StepCounterContext);
  if (!ctx) {
    throw new Error("useStepCounter() must be used within a <StepCounterProvider>");
  }
  return ctx;
}

/** Saatlik dizinin bos hali (sunucu/yerel veri yokken grafikte kullanilir). */
export const EMPTY_HOURLY = emptyHourly();
