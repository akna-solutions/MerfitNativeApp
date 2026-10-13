import type { MiniGameRewardTier } from "../../../services/api/types";

/**
 * Odul tablosu yardimcilari - YALNIZCA gosterim icin. Tablo sunucudan (oturum acilirken) gelir; verilen
 * puani her zaman sunucu hesaplar. Burada sabit odul degeri tutulmaz.
 */

/** Esikler kucukten buyuge. */
export function sortTiers(tiers: readonly MiniGameRewardTier[]): MiniGameRewardTier[] {
  return [...tiers].sort((a, b) => a.minScore - b.minScore);
}

/** Skordan sonraki ilk odul esigi; en ust esige ulasildiysa null. */
export function nextTierFor(tiers: readonly MiniGameRewardTier[], score: number): MiniGameRewardTier | null {
  return sortTiers(tiers).find((tier) => tier.minScore > score) ?? null;
}
