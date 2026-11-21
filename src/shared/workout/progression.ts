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
  progression:
    | (Pick<ProgressionSuggestion, "suggestedWeightKg"> & Partial<Pick<ProgressionSuggestion, "isConfident" | "previousWeightKg">>)
    | null
    | undefined,
  lastSets: { weight: number | null }[],
): string {
  // Kosullu oneri (orn. RIR girilmedigi icin artis kesin degil): kutuya artirilmis agirlik yazilmaz; kullanici
  // mesaji okuyup kendisi artirir. Onceki agirlikla baslar.
  if (progression?.isConfident === false && progression.previousWeightKg && progression.previousWeightKg > 0) {
    return String(progression.previousWeightKg);
  }
  if (progression?.suggestedWeightKg && progression.suggestedWeightKg > 0) return String(progression.suggestedWeightKg);
  const weight = lastSets.find((set) => set.weight && set.weight > 0)?.weight;
  return weight ? String(weight) : "";
}

/** RIR secenekleri: 0 = tukenis, 4 = "4+" (rahat). */
export const RIR_OPTIONS = [0, 1, 2, 3, 4] as const;

export function rirLabel(rir: number): string {
  return rir >= 4 ? "4+" : String(rir);
}

/**
 * Bir egzersizdeki sonraki set numarasi: isinma ve basarisiz setler de numara alir (backend ayni numarayi
 * guncelleme olarak kabul eder), calisma seti sayaci ise yalnizca tamamlanan calisma setlerini sayar.
 */
export function nextSetNumber(workSets: number, extraSets: number): number {
  return workSets + extraSets + 1;
}
