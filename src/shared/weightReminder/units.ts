export const KG_PER_LB = 0.45359237;
export const MIN_WEIGHT_KG = 20;
export const MAX_WEIGHT_KG = 400;

export type UnitSystem = "metric" | "imperial";

export const unitLabel = (unit: UnitSystem) => (unit === "imperial" ? "lb" : "kg");

/** kg -> gosterim birimi (bir ondalik). */
export function fromKg(kg: number, unit: UnitSystem): number {
  const value = unit === "imperial" ? kg / KG_PER_LB : kg;
  return Math.round(value * 10) / 10;
}

/** "82,4" / "82.4" girisini kg'a cevirir; gecersiz veya 20-400 kg disindaysa null. */
export function parseWeightToKg(text: string, unit: UnitSystem): number | null {
  const normalized = text.replace(",", ".").trim();
  if (!/^\d{1,3}(\.\d{0,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  const kg = unit === "imperial" ? value * KG_PER_LB : value;
  const rounded = Math.round(kg * 10) / 10;
  return rounded >= MIN_WEIGHT_KG && rounded <= MAX_WEIGHT_KG ? rounded : null;
}
