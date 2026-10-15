import type { ProgressionSuggestion } from "../../services/api/types";

/** "8-12" veya tek hedefte "10". */
export function formatRepRange(repsMin: number, repsMax?: number | null): string {
  return repsMax && repsMax > repsMin ? `${repsMin}-${repsMax}` : `${repsMin}`;
}

/**
 * Egzersize baslarken agirlik kutusunun ilk degeri: backend'in cift progresyon onerisi varsa onerilen
 * agirlik, yoksa gecen seferki ilk agirlik. Bos string = kullanici girecek.
 */
export function initialWeight(
  progression: Pick<ProgressionSuggestion, "suggestedWeightKg"> | null | undefined,
  lastSets: { weight: number | null }[],
): string {
  if (progression?.suggestedWeightKg && progression.suggestedWeightKg > 0) return String(progression.suggestedWeightKg);
  const weight = lastSets.find((set) => set.weight && set.weight > 0)?.weight;
  return weight ? String(weight) : "";
}
