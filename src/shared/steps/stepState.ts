import type { StepSettings, StepSyncDay, StepSyncDayResult } from "../../services/api/steps";
import { addDays, parseDateKey, toDateKey } from "../calendar/dates";

/**
 * Adim sayarin cihazdaki durumu ve saf (yan etkisiz) islemleri.
 *
 * Model: her yerel gun ("yyyy-MM-dd", cihazin o anki saat dilimi) icin 24 saatlik adim kovasi tutulur.
 * - Sensorun kumulatif degeri hicbir yerde saklanmaz; yalnizca "bu saatte atilan adim" kovalara yazilir.
 * - Iki kaynaktan gelen ayni gun (iOS gecmis sorgusu, sunucudan geri yukleme) saat bazinda "buyuk olan kalir"
 *   kuraliyla birlestirilir: ayni adimlar iki kez sayilmaz, deger hicbir zaman azalmaz.
 * - Android canli sayacindan gelen artislar (delta) olayin yerel saatindeki kovaya eklenir; gun degisince yeni
 *   gunun kovasi bos baslar (gece yarisi sifirlama), onceki gun korunur.
 */

export const HOURS_PER_DAY = 24;
/** Bugun + iOS'un sakladigi 7 gecmis gun; sunucu da en fazla 7 gun geriye kabul eder. */
export const KEEP_DAYS = 8;
export const STEP_STATE_VERSION = 1;

/** Sunucudan ayar alinamadiysa kullanilan varsayilanlar (sunucudaki StepActivity ayarlariyla ayni). */
export const DEFAULT_STEP_SETTINGS: StepSettings = {
  dailyGoal: 10_000,
  defaultDailyGoal: 10_000,
  minDailyGoal: 1_000,
  maxDailyGoal: 100_000,
  strideLengthMeters: 0.762,
  caloriesPerStep: (0.762 / 1000) * 70 * 0.5,
};

export type LocalStepDay = {
  hourly: number[];
  /** Gun icinde gorulen en buyuk UTC farki (dk); sunucu zaman kontrollerinde kullanir. */
  offsetMinutes: number;
  /** iOS: gun bittikten sonra tum saatleri CoreMotion'dan okundu; tekrar okumaya gerek yok. */
  finalized?: boolean;
};

export type StepState = {
  version: number;
  /** Verinin sahibi (kullanici adi); farkli kullanici giris yaparsa durum sifirlanir. */
  owner: string | null;
  days: Record<string, LocalStepDay>;
  /** Gun -> sunucunun kabul ettigi saatlik verinin imzasi. Imza degismediyse gun tekrar gonderilmez. */
  synced: Record<string, string>;
  settings: StepSettings | null;
  /** Cevrimdisiyken degistirilen ve henuz sunucuya yazilamayan hedef. */
  pendingGoal: number | null;
  lastSyncAt: number | null;
};

export function emptyStepState(owner: string | null): StepState {
  return { version: STEP_STATE_VERSION, owner, days: {}, synced: {}, settings: null, pendingGoal: null, lastSyncAt: null };
}

export function emptyHourly(): number[] {
  return new Array<number>(HOURS_PER_DAY).fill(0);
}

/** Cihazin yerel UTC farki (dk), orn. Turkiye icin 180. */
export function utcOffsetMinutes(at: Date): number {
  return -at.getTimezoneOffset();
}

export function totalSteps(hourly: readonly number[] | undefined): number {
  return (hourly ?? []).reduce((sum, value) => sum + value, 0);
}

export function hourlySignature(hourly: readonly number[]): string {
  return hourly.join(",");
}

function sanitizeHourly(hourly: readonly number[] | null | undefined): number[] {
  const result = emptyHourly();
  for (let h = 0; h < HOURS_PER_DAY; h++) {
    const value = Number(hourly?.[h] ?? 0);
    result[h] = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }
  return result;
}

/** Saat bazinda buyuk olani alir (ayni adimlar iki kez sayilmaz, deger azalmaz). */
export function mergeHourly(a: readonly number[] | undefined, b: readonly number[] | undefined): number[] {
  const left = sanitizeHourly(a);
  const right = sanitizeHourly(b);
  return left.map((value, h) => Math.max(value, right[h]));
}

/** Bir gunun saatlik degerlerini mevcut veriyle birlestirir (iOS gecmis sorgusu, sunucudan geri yukleme). */
export function mergeDay(state: StepState, dateKey: string, hourly: readonly number[], offsetMinutes: number): StepState {
  const current = state.days[dateKey];
  const merged = mergeHourly(current?.hourly, hourly);
  if (current && hourlySignature(merged) === hourlySignature(current.hourly) && current.offsetMinutes >= offsetMinutes) {
    return state;
  }
  return {
    ...state,
    days: {
      ...state.days,
      [dateKey]: {
        ...current,
        hourly: merged,
        offsetMinutes: current ? Math.max(current.offsetMinutes, offsetMinutes) : offsetMinutes,
      },
    },
  };
}

/** Canli sayactan gelen artisi olayin yerel gun/saat kovasina ekler. */
export function addSteps(state: StepState, at: Date, steps: number): StepState {
  const delta = Math.floor(steps);
  if (!Number.isFinite(delta) || delta <= 0) return state;
  const dateKey = toDateKey(at);
  const current = state.days[dateKey];
  const hourly = current ? [...current.hourly] : emptyHourly();
  hourly[at.getHours()] += delta;
  const offset = utcOffsetMinutes(at);
  return {
    ...state,
    days: {
      ...state.days,
      [dateKey]: { ...current, hourly, offsetMinutes: current ? Math.max(current.offsetMinutes, offset) : offset },
    },
  };
}

export function markFinalized(state: StepState, dateKey: string): StepState {
  const current = state.days[dateKey] ?? { hourly: emptyHourly(), offsetMinutes: utcOffsetMinutes(new Date()) };
  if (current.finalized) return state;
  return { ...state, days: { ...state.days, [dateKey]: { ...current, finalized: true } } };
}

/** Son KEEP_DAYS gun disindaki (ve gelecekteki) gunleri atar. */
export function pruneDays(state: StepState, today: Date): StepState {
  const keep = new Set(recentDateKeys(today, KEEP_DAYS));
  const days: Record<string, LocalStepDay> = {};
  const synced: Record<string, string> = {};
  let changed = false;
  for (const [key, day] of Object.entries(state.days)) {
    if (keep.has(key)) days[key] = day;
    else changed = true;
  }
  for (const [key, signature] of Object.entries(state.synced)) {
    if (keep.has(key)) synced[key] = signature;
    else changed = true;
  }
  return changed ? { ...state, days, synced } : state;
}

/** Bugunden geriye `count` gunun anahtarlari (en eskiden bugune). */
export function recentDateKeys(today: Date, count: number): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) keys.push(toDateKey(addDays(today, -i)));
  return keys;
}

/** Sunucuya gonderilmesi gereken gunler: yerel veri sunucunun son kabul ettiginden farkli. */
export function pendingSyncDays(state: StepState, today: Date): StepSyncDay[] {
  const keys = new Set(recentDateKeys(today, KEEP_DAYS));
  return Object.entries(state.days)
    .filter(([key, day]) => keys.has(key) && totalSteps(day.hourly) > 0 && state.synced[key] !== hourlySignature(day.hourly))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, day]) => ({ date: key, hourlySteps: [...day.hourly], utcOffsetMinutes: day.offsetMinutes }));
}

/**
 * Sunucu yanitindan sonra gonderilen imzalari isaretler. Istek surerken yeni adim gelmis olabilir; bu yuzden
 * guncel veri degil, gonderilen veri isaretlenir (yeni adimlar bir sonraki senkronizasyonda gider).
 * Reddedilen gunler (tarih penceresi disi) de isaretlenir ki ayni gun surekli tekrar gonderilmesin.
 */
export function markSynced(state: StepState, sent: StepSyncDay[], results: StepSyncDayResult[], now: number): StepState {
  const byDate = new Map(results.map((r) => [r.date, r]));
  const synced = { ...state.synced };
  for (const day of sent) {
    if (byDate.has(day.date)) synced[day.date] = hourlySignature(day.hourlySteps);
  }
  return { ...state, synced, lastSyncAt: now };
}

export type StepEstimates = { distanceKm: number; calories: number };

export function estimateFromSteps(steps: number, settings: StepSettings | null): StepEstimates {
  const s = settings ?? DEFAULT_STEP_SETTINGS;
  return {
    distanceKm: (steps * s.strideLengthMeters) / 1000,
    calories: Math.round(steps * s.caloriesPerStep),
  };
}

export type GoalProgress = { percent: number; ratio: number; remaining: number; completed: boolean };

export function goalProgress(steps: number, goal: number): GoalProgress {
  const safeGoal = goal > 0 ? goal : DEFAULT_STEP_SETTINGS.dailyGoal;
  const percent = Math.round((steps / safeGoal) * 1000) / 10;
  return {
    percent,
    ratio: Math.min(1, steps / safeGoal),
    remaining: Math.max(0, safeGoal - steps),
    completed: steps >= safeGoal,
  };
}

/** Kayitli (dosyadan okunan) veriyi dogrular; bozuk/eski surumse null. */
export function parseStoredState(raw: string | null): StepState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StepState>;
    if (!value || value.version !== STEP_STATE_VERSION || typeof value.days !== "object" || value.days === null) return null;
    const days: Record<string, LocalStepDay> = {};
    for (const [key, day] of Object.entries(value.days)) {
      if (!parseDateKey(key) || !day) continue;
      days[key] = {
        hourly: sanitizeHourly(day.hourly),
        offsetMinutes: Number.isFinite(day.offsetMinutes) ? day.offsetMinutes : 0,
        finalized: day.finalized === true,
      };
    }
    return {
      version: STEP_STATE_VERSION,
      owner: typeof value.owner === "string" ? value.owner : null,
      days,
      synced: value.synced && typeof value.synced === "object" ? { ...value.synced } : {},
      settings: value.settings ?? null,
      pendingGoal: typeof value.pendingGoal === "number" ? value.pendingGoal : null,
      lastSyncAt: typeof value.lastSyncAt === "number" ? value.lastSyncAt : null,
    };
  } catch {
    return null;
  }
}

export function effectiveGoal(state: StepState): number {
  return state.pendingGoal ?? state.settings?.dailyGoal ?? DEFAULT_STEP_SETTINGS.dailyGoal;
}
