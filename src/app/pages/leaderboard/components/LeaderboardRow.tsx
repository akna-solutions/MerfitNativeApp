import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { LeaderboardEntry } from "../types";

type Props = {
  entry: LeaderboardEntry;
  showRewardBadge?: boolean;
  /** Kullanıcı Gizlilik ayarından "Profili liderlik tablosunda göster"ü kapattıysa true gelir. */
  anonymized?: boolean;
};

export function LeaderboardRow({ entry, showRewardBadge, anonymized }: Props) {
  const isHiddenSelf = entry.isCurrentUser && anonymized;
  const displayName = isHiddenSelf ? "Anonim" : entry.name;
  const initial = isHiddenSelf
    ? "?"
    : entry.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <View style={[styles.row, entry.isCurrentUser && styles.rowActive]}>
      <Text style={[styles.rank, entry.isCurrentUser && styles.rankActive]}>
        #{entry.rank}
      </Text>

      <View style={[styles.avatar, entry.isCurrentUser && styles.avatarActive]}>
        <Text style={styles.avatarLabel}>{initial}</Text>
      </View>

      <View style={styles.nameBlock}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.isCurrentUser
            ? isHiddenSelf
              ? "Anonim (Sen)"
              : `${displayName} (Sen)`
            : displayName}
        </Text>
        <Text style={styles.workouts}>{entry.workouts} antrenman</Text>
      </View>

      {showRewardBadge && entry.rank <= 10 ? (
        <View style={styles.rewardBadge}>
          <Text style={styles.rewardBadgeLabel}>Ödül</Text>
        </View>
      ) : null}

      <Text style={styles.points}>{entry.points.toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 12,
  },
  rowActive: {
    backgroundColor: colors.cardBackgroundActive,
    borderWidth: 1,
    borderColor: "rgba(0,168,255,0.35)",
  },
  rank: { color: colors.textMuted, fontSize: 13, fontWeight: "700", width: 32 },
  rankActive: { color: colors.electricBlue },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  avatarActive: { backgroundColor: colors.buttonElectricBlue },
  avatarLabel: { color: colors.textPrimary, fontSize: 12, fontWeight: "700" },
  nameBlock: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  workouts: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  rewardBadge: {
    height: 20,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,168,255,0.4)",
  },
  rewardBadgeLabel: {
    color: colors.electricBlue,
    fontSize: 9,
    fontWeight: "700",
  },
  points: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
});
