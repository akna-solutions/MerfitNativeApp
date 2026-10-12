import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { LeaderboardEarnedReward } from "../../../../services/api/types";
import { RewardImage } from "./RewardImage";

const STATUS_LABELS: Record<LeaderboardEarnedReward["status"], string> = {
  pending: "Teslim bekliyor",
  claimed: "Teslim edildi",
  expired: "Süresi doldu",
};

type Props = { rewards: LeaderboardEarnedReward[] };

/** Kullanicinin siralama donemlerinde kazandigi hediyeler. */
export function EarnedRewards({ rewards }: Props) {
  const { colors } = useTheme();

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Hediyelerim</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {rewards.map((reward, index) => (
          <View
            key={reward.id}
            style={[styles.row, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}
          >
            <View style={styles.thumb}>
              <RewardImage icon={reward.icon} imageUrl={reward.imageUrl} size="small" />
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                {reward.title}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {reward.rank ? `#${reward.rank}. sıra · ` : ""}
                {new Date(reward.earnedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </Text>
            </View>
            <Text
              style={[
                styles.status,
                { color: reward.status === "pending" ? colors.primary : colors.textSecondary },
              ]}
            >
              {STATUS_LABELS[reward.status] ?? reward.status}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 14 },
  card: {
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  thumb: { width: 56 },
  textBlock: { flex: 1 },
  title: { fontSize: 13, fontWeight: "700" },
  meta: { fontSize: 11, marginTop: 4 },
  status: { fontSize: 11, fontWeight: "700" },
});
