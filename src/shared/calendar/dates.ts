/**
 * Takvim icin tarih yardimcilari. Tum gunler "yyyy-MM-dd" anahtariyla (kullanicinin yerel gunu) tutulur;
 * Date nesneleri yalnizca yerel saatte, gun ortasinda (12:00) olusturulur ki yaz saati gecislerinde
 * gun kaymasin. Hafta Pazartesi baslar (tr-TR).
 */

export const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

/** Pazartesiden baslayan kisa gun adlari. */
export const WEEKDAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

/** Pazartesiden baslayan tek harfli gun adlari. */
export const WEEKDAY_LETTER = ["P", "S", "Ç", "P", "C", "C", "P"];

const WEEKDAY_LONG = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

const pad = (value: number) => String(value).padStart(2, "0");

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "yyyy-MM-dd" -> yerel saatte o gunun 12:00'si; gecersizse null. */
export function parseDateKey(key: string | null | undefined): Date | null {
  if (!key) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return toDateKey(date) === key ? date : null;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
}

/** Pazartesi = 0 ... Pazar = 6. */
export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function startOfWeek(date: Date): Date {
  return addDays(date, -mondayIndex(date));
}

/** Haftanin (Pazartesi-Pazar) 7 gununun anahtarlari. */
export function weekKeys(date: Date): string[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(start, i)));
}

export type MonthGrid = {
  year: number;
  /** 0-11 */
  month: number;
  /** Izgaranin ilk ve son gunu (onceki/sonraki aydan tamamlayici gunler dahil). */
  from: string;
  to: string;
  /** Her hafta 7 gun; ay disindaki gunler inMonth=false. */
  weeks: { key: string; day: number; inMonth: boolean }[][];
};

/** Pazartesi baslayan aylik izgara (4-6 hafta). */
export function buildMonthGrid(year: number, month: number): MonthGrid {
  const first = new Date(year, month, 1, 12);
  const last = new Date(year, month + 1, 0, 12);
  const gridStart = startOfWeek(first);
  const gridEnd = addDays(startOfWeek(last), 6);

  const weeks: MonthGrid["weeks"] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(cursor, i);
        return { key: toDateKey(date), day: date.getDate(), inMonth: date.getMonth() === month };
      }),
    );
  }

  return { year, month, from: toDateKey(gridStart), to: toDateKey(gridEnd), weeks };
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month + delta, 1, 12);
  return { year: date.getFullYear(), month: date.getMonth() };
}

/** "29 Ekim Perşembe" */
export function formatLongDate(key: string): string {
  const date = parseDateKey(key);
  if (!date) return key;
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${WEEKDAY_LONG[date.getDay()]}`;
}
