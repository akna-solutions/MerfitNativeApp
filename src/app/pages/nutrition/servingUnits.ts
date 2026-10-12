/** Backend'deki ServingUnits.IsWeighable ile ayni liste: gram/ml ile serbestce girilebilen birimler. */
const WEIGHABLE_UNITS = new Set(["g", "gr", "gram", "ml"]);

export function isWeighableUnit(unit: string): boolean {
  return WEIGHABLE_UNITS.has(unit.trim().toLowerCase());
}

/** Ekranda gosterilecek kisa birim: "gr"/"gram" -> "g". */
export function displayUnit(unit: string): string {
  const normalized = unit.trim().toLowerCase();
  return normalized === "ml" ? "ml" : isWeighableUnit(normalized) ? "g" : unit.trim();
}
