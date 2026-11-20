import { Pedometer } from "expo-sensors";
import { Platform } from "react-native";

import type { StepSource } from "../../services/api/steps";
import { HOURS_PER_DAY } from "./stepState";

/**
 * Telefonun adim sensorune erisim (expo-sensors Pedometer). Platform gercekleri:
 *
 * - iOS (CoreMotion): getStepCountAsync son 7 gunun adimlarini verir; telefon cebinde tasindigi surece uygulama
 *   kapali/arka plandayken atilan adimlar da sonradan okunabilir. Bu nedenle iOS'ta veri kaynagi her zaman
 *   CoreMotion gecmisidir (saat saat okunur); canli izleme yalnizca ekrani guncellemek icin bir tetikleyicidir.
 * - Android: getStepCountAsync desteklenmez; watchStepCount yalnizca uygulama on plandayken, abonelikten bu
 *   yana atilan adimlari verir. Uygulama kapali/arka plandayken atilan adimlar bu kaynakla alinamaz; bunun icin
 *   Health Connect entegrasyonu gerekir (StepHistorySource arayuzu bu amacla ayrilmistir).
 * - Web: sensor yok.
 */

export type SensorStatus =
  /** Platform desteklemiyor (web). */
  | "unsupported"
  /** Cihazda adim sensoru yok ya da kapali. */
  | "unavailable"
  /** Izin henuz istenmedi. */
  | "undetermined"
  /** Izin reddedildi; yeniden sorulamiyorsa kullanici Ayarlar'a yonlendirilir. */
  | "denied"
  | "granted";

export type SensorPermission = { status: SensorStatus; canAskAgain: boolean };

/**
 * Gecmis adim okuyabilen kaynak (iOS CoreMotion; ileride HealthKit / Health Connect). Kaynak degisirse
 * yalnizca bu arayuzun yeni bir uygulamasi yazilir; durum/senkronizasyon katmani degismez.
 */
export interface StepHistorySource {
  readonly kind: StepSource;
  /** [start, end) araligindaki adim sayisi. */
  stepsBetween(start: Date, end: Date): Promise<number>;
}

export const SOURCE_KIND: StepSource = "pedometer";

/** Bu platformda gecmis adim okunabiliyor mu (iOS: evet, Android/web: hayir). */
export function supportsHistory(): boolean {
  return Platform.OS === "ios";
}

export async function getSensorPermission(request = false): Promise<SensorPermission> {
  if (Platform.OS === "web") return { status: "unsupported", canAskAgain: false };
  try {
    const available = await Pedometer.isAvailableAsync();
    if (!available) return { status: "unavailable", canAskAgain: false };
    const permission = request ? await Pedometer.requestPermissionsAsync() : await Pedometer.getPermissionsAsync();
    if (permission.granted) return { status: "granted", canAskAgain: true };
    if (permission.status === "undetermined") return { status: "undetermined", canAskAgain: permission.canAskAgain };
    return { status: "denied", canAskAgain: permission.canAskAgain };
  } catch {
    return { status: "unavailable", canAskAgain: false };
  }
}

export const coreMotionSource: StepHistorySource = {
  kind: "pedometer",
  async stepsBetween(start: Date, end: Date) {
    if (end <= start) return 0;
    const result = await Pedometer.getStepCountAsync(start, end);
    return Math.max(0, Math.floor(result.steps ?? 0));
  },
};

/**
 * Bir yerel gunun saatlik adimlarini okur. Bugun icin yalnizca gecmis/icinde bulunulan saatler sorgulanir.
 * Saat sinirlari cihazin yerel saatine gore kurulur (new Date(y, m, d, h)); yaz saati gecisinde bir kova bos
 * ya da iki saatlik olabilir, toplam degismez.
 */
export async function readDayHourly(source: StepHistorySource, day: Date, now: Date): Promise<number[]> {
  const hourly = new Array<number>(HOURS_PER_DAY).fill(0);
  const tasks: Promise<void>[] = [];
  for (let h = 0; h < HOURS_PER_DAY; h++) {
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h);
    if (start >= now) break;
    const next = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h + 1);
    const end = next > now ? now : next;
    tasks.push(
      source.stepsBetween(start, end).then((steps) => {
        hourly[h] = steps;
      }),
    );
  }
  await Promise.all(tasks);
  return hourly;
}

/**
 * Android canli sayaci: aboneligin kumulatif degerini artislara (delta) cevirir. Arka plandan donuste abonelik
 * yenilenir (birikmis buyuk bir deger tek saate yazilmasin diye); bir olayda gecen sureye gore makul olandan
 * fazlasi atilir (en fazla saniyede 5 adim).
 */
export function watchStepDeltas(onDelta: (steps: number, at: Date) => void): () => void {
  let last = 0;
  let lastAt = Date.now();
  const subscription = Pedometer.watchStepCount((result) => {
    const now = Date.now();
    const cumulative = Math.max(0, Math.floor(result.steps ?? 0));
    let delta = cumulative >= last ? cumulative - last : cumulative;
    last = cumulative;
    const maxPlausible = Math.ceil(((now - lastAt) / 1000 + 1) * 5);
    lastAt = now;
    delta = Math.min(delta, maxPlausible);
    if (delta > 0) onDelta(delta, new Date(now));
  });
  return () => subscription.remove();
}
