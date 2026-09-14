import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { LeaderboardEntry } from "../types";

type Props = {
  entry: LeaderboardEntry;
  showRewardBadge?: boolean;
  /** Kullanıcı Gizlilik ayarından "Profili liderlik tablosunda göster"ü kapattıysa true gelir. */
  anonymized?: boolean;
};

export function LeaderboardRow({ entry, showRewardBadge, anonymized }: Props) {
  const { colors } = useTheme();
  const isHiddenSelf = entry.isCurrentUser && anonymized;
  const displayName = isHiddenSelf ? "Anonim" : entry.name;
  const initial = isHiddenSelf
    ? "?"
    : entry.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <View style={[styles.row, entry.isCurrentUser && { backgroundColor: colors.cardActive, borderWidth: 1, borderColor: "rgba(0,168,255,0.35)" }]}>
      <Text style={[styles.rank, { color: colors.textSecondary }, entry.isCurrentUser && { color: colors.primary }]}>
        #{entry.rank}
      </Text>

      <View style={[styles.avatar, { backgroundColor: colors.inputBackground }, entry.isCurrentUser && { backgroundColor: colors.primaryPressed }]}>
        <Text style={[styles.avatarLabel, { color: entry.isCurrentUser ? "#FFFFFF" : colors.text }]}>{initial}</Text>
      </View>

      <View style={styles.nameBlock}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {entry.isCurrentUser
            ? isHiddenSelf
              ? "Anonim (Sen)"
              : `${displayName} (Sen)`
            : displayName}
        </Text>
        <Text style={[styles.workouts, { color: colors.textSecondary }]}>{entry.workouts} antrenman</Text>
      </View>

      {showRewardBadge && entry.rank <= 10 ? (
        <View style={styles.rewardBadge}>
          <Text style={[styles.rewardBadgeLabel, { color: colors.primary }]}>Ödül</Text>
        </View>
      ) : null}

      <Text style={[styles.points, { color: colors.text }]}>{entry.points.toLocaleString()}</Text>
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
  rank: { fontSize: 13, fontWeight: "700", width: 32 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: { fontSize: 12, fontWeight: "700" },
  nameBlock: { flex: 1 },
  name: { fontSize: 13, fontWeight: "700" },
  workouts: { fontSize: 11, marginTop: 2 },
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
    fontSize: 9,
    fontWeight: "700",
  },
  points: { fontSize: 13, fontWeight: "700" },
});
