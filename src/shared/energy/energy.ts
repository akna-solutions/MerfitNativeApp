import type { EnergyDay, EnergyTone } from "../../services/api/energyBalance";
import type { ThemeTokens } from "../theme/tokens";
import { addDays, parseDateKey, toDateKey } from "../calendar/dates";

/**
 * Kalori dengesi ekranlarinin ortak yardimcilari. Hesaplamanin kendisi sunucudadir; burada yalnizca renk,
 * bicim, donem secimi ve bugunun adimlarinin senkronizasyon beklerken anlik yansitilmasi vardir.
 */

/** Durum renkleri: renkler mutlak saglik yargisi degil, kullanicinin hedefine gore isarettir. Mor kullanilmaz. */
export const ENERGY_TONE_COLORS = {
  green: "#22C55E",
  orange: "#F59E0B",
} as const;

export function toneColor(tone: EnergyTone, colors: ThemeTokens): string {
  switch (tone) {
    case "green":
      return ENERGY_TONE_COLORS.green;
    case "orange":
      return ENERGY_TONE_COLORS.orange;
    case "red":
      return colors.danger;
    default:
      return colors.primary;
  }
}

/** Harcama dagilimi renkleri (mavi tonlari + notr gri; mor yok). */
export const BREAKDOWN_COLORS = {
  bmr: "#3E7BFA",
  walking: "#00A8FF",
  dailyMovement: "#7CC4FF",
  workout: "#F59E0B",
  thermicEffect: "#8A8F98",
} as const;

const tr = (value: number) => Math.round(value).toLocaleString("tr-TR");

export function formatKcalValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : `${tr(value)} kcal`;
}

/** +350 / -350 / 0 (eksi isareti tipografik). */
export function formatSignedKcal(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const rounded = Math.round(value);
  if (rounded === 0) return "0 kcal";
  return `${rounded > 0 ? "+" : "−"}${tr(Math.abs(rounded))} kcal`;
}

export function balanceLabel(balance: number | null | undefined): string {
  if (balance === null || balance === undefined) return "Denge hesaplanamadı";
  if (Math.abs(balance) <= 50) return "Kalori dengesi";
  return balance > 0 ? "Kalori fazlası" : "Kalori açığı";
}

export function goalLabel(direction: EnergyDay["goalDirection"]): string {
  switch (direction) {
    case "lose":
      return "Kilo verme";
    case "gain":
      return "Kilo alma";
    case "maintain":
      return "Kilo koruma";
    default:
      return "Hedef belirtilmedi";
  }
}

/**
 * Bugunun adimlari sunucuya henuz gonderilmediyse (yerel sayac sunucudakinden fazlaysa) farki, sunucunun adim
 * basina kalori katsayisiyla gunluk hareketlilige ekler. Antrenman sirasindaki adimlar sunucu senkronunda
 * zaten ayiklanir; aradaki kisa sure icin bu yaklasim yeterlidir. Gecmis gunlere dokunmaz.
 */
export function withLiveSteps(day: EnergyDay, localSteps: number, caloriesPerStep: number): EnergyDay & { pendingSteps: number } {
  const pendingSteps = day.isToday ? Math.max(0, Math.round(localSteps - day.activity.steps)) : 0;
  if (pendingSteps === 0 || day.expenditureCalories === null || !(caloriesPerStep > 0)) {
    return { ...day, pendingSteps };
  }

  const extra = Math.round(pendingSteps * caloriesPerStep);
  const expenditureCalories = day.expenditureCalories + extra;
  return {
    ...day,
    pendingSteps,
    expenditureCalories,
    balance: day.intakeCalories - expenditureCalories,
    expenditure: { ...day.expenditure, dailyMovement: day.expenditure.dailyMovement + extra },
    activity: { ...day.activity, steps: day.activity.steps + pendingSteps },
  };
}

export type PeriodKey = "today" | "yesterday" | "week" | "month" | "custom";

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Bugün" },
  { key: "yesterday", label: "Dün" },
  { key: "week", label: "7 gün" },
  { key: "month", label: "30 gün" },
  { key: "custom", label: "Özel" },
];

/** En uzun ozel aralik (sunucu siniriyla ayni). */
export const MAX_RANGE_DAYS = 92;

/** Donemin yerel tarih araligi (dahil). */
export function periodRange(period: Exclude<PeriodKey, "custom">, todayKey: string): { from: string; to: string } {
  const today = parseDateKey(todayKey) ?? new Date();
  switch (period) {
    case "today":
      return { from: todayKey, to: todayKey };
    case "yesterday": {
      const key = toDateKey(addDays(today, -1));
      return { from: key, to: key };
    }
    case "week":
      return { from: toDateKey(addDays(today, -6)), to: todayKey };
    default:
      return { from: toDateKey(addDays(today, -29)), to: todayKey };
  }
}

/** Ozel araligi gecerli tutar: bitis bugunu asmaz, baslangic bitisten sonra olmaz, en fazla MAX_RANGE_DAYS gun. */
export function clampCustomRange(from: string, to: string, todayKey: string): { from: string; to: string } {
  const today = parseDateKey(todayKey)!;
  let end = parseDateKey(to) ?? today;
  if (end > today) end = today;
  let start = parseDateKey(from) ?? end;
  if (start > end) start = end;
  const earliest = addDays(end, -(MAX_RANGE_DAYS - 1));
  if (start < earliest) start = earliest;
  return { from: toDateKey(start), to: toDateKey(end) };
}

/** Harcama kalemleri (gosterim sirasi). */
export function breakdownItems(day: EnergyDay): { key: keyof typeof BREAKDOWN_COLORS; label: string; value: number }[] {
  const e = day.expenditure;
  return [
    { key: "bmr", label: day.isToday ? "Bazal metabolizma (şu ana kadar)" : "Bazal metabolizma", value: e.bmr ?? 0 },
    { key: "walking", label: "Yürüyüş", value: e.walking },
    { key: "dailyMovement", label: "Günlük hareketlilik", value: e.dailyMovement },
    { key: "workout", label: "Antrenman", value: e.workout },
    { key: "thermicEffect", label: "Diğer: besinlerin termik etkisi", value: e.thermicEffect },
  ];
}
