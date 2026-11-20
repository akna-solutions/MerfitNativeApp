/** Adim sayar ekranlari icin Turkce sayi bicimleri: 8.450 adim, %84,5, 6,2 km. */

export function formatSteps(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString("tr-TR");
}

export function formatPercent(percent: number): string {
  return `%${percent.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}`;
}

export function formatKm(km: number): string {
  return `${km.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

export function formatKcal(kcal: number): string {
  return `${Math.max(0, Math.round(kcal)).toLocaleString("tr-TR")} kcal`;
}
