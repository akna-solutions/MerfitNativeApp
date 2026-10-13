import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeContext";
import type { MiniGameRewardTier } from "../../../../services/api/types";
import { sortTiers } from "../rewards";

type Props = {
  tiers: readonly MiniGameRewardTier[];
  remainingToday: number;
  dailyPointLimit: number;
};

/**
 * Oyunun altindaki odul ozeti: her esik icin kucuk bir kart (skor / puan) ve bugun kalan puan hakki.
 * Tablo sunucudan gelir; burada yalnizca gosterilir.
 */
export function RewardInfo({ tiers, remainingToday, dailyPointLimit }: Props) {
  const { colors } = useTheme();
  const limitReached = remainingToday <= 0;

  return (
    <View testID="dumbbell-dash-reward-info" style={styles.wrapper}>
      <View style={styles.tiers}>
        {sortTiers(tiers).map((tier) => (
          <View
            key={tier.minScore}
            accessible
            accessibilityLabel={`${tier.minScore} skor, ${tier.points} puan`}
            style={[styles.tier, { backgroundColor: colors.inputBackground, opacity: limitReached ? 0.5 : 1 }]}
          >
            <Text style={[styles.tierScore, { color: colors.text }]}>{tier.minScore}</Text>
            <Text style={[styles.tierPoints, { color: colors.textSecondary }]}>+{tier.points} puan</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.caption, { color: colors.textSecondary }]}>
        {limitReached
          ? "Bugünkü puan hakkını doldurdun. Oyun puansız devam eder."
          : `Bugün ${remainingToday} / ${dailyPointLimit} puan daha kazanabilirsin`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  tiers: { flexDirection: "row", gap: 6 },
  tier: { flex: 1, borderRadius: 12, paddingVertical: 8, alignItems: "center" },
  tierScore: { fontSize: 15, fontWeight: "800", fontVariant: ["tabular-nums"] },
  tierPoints: { fontSize: 11, fontWeight: "600", marginTop: 1 },
  caption: { fontSize: 12, textAlign: "center" },
});
