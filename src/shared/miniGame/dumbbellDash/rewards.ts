import type { MiniGameRewardTier } from "../../../services/api/types";

/**
 * Odul tablosu yardimcilari - YALNIZCA gosterim icin. Tablo sunucudan (oturum acilirken) gelir; verilen
 * puani her zaman sunucu hesaplar. Burada sabit odul degeri tutulmaz.
 */

function sorted(tiers: readonly MiniGameRewardTier[]): MiniGameRewardTier[] {
  return [...tiers].sort((a, b) => a.minScore - b.minScore);
}

/** Skordan sonraki ilk odul esigi; en ust esige ulasildiysa null. */
export function nextTierFor(tiers: readonly MiniGameRewardTier[], score: number): MiniGameRewardTier | null {
  return sorted(tiers).find((tier) => tier.minScore > score) ?? null;
}

/** "10 skor → 1 · 20 → 2 · 30 → 3 · 50 → 5" */
export function describeTiers(tiers: readonly MiniGameRewardTier[]): string {
  return sorted(tiers)
    .map((tier, index) => (index === 0 ? `${tier.minScore} skor → ${tier.points}` : `${tier.minScore} → ${tier.points}`))
    .join(" · ");
}
