import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { LeaderboardEntry } from "../types";

type Props = { entries: LeaderboardEntry[] };

export function TopThree({ entries }: Props) {
  const [first, second, third] = entries;
  if (!first) return null;

  return (
    <View style={styles.wrapper}>
      <PodiumItem entry={first} size="large" />
      <View style={styles.secondThirdRow}>
        {second ? (
          <PodiumItem entry={second} size="small" />
        ) : (
          <View style={styles.flex} />
        )}
        {third ? (
          <PodiumItem entry={third} size="small" />
        ) : (
          <View style={styles.flex} />
        )}
      </View>
    </View>
  );
}

function PodiumItem({
  entry,
  size,
}: {
  entry: LeaderboardEntry;
  size: "large" | "small";
}) {
  const isLarge = size === "large";
  const initial = entry.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <View style={[styles.item, isLarge && styles.itemLarge]}>
      <View
        style={[
          styles.avatar,
          isLarge ? styles.avatarLarge : styles.avatarSmall,
        ]}
      >
        <Text style={[styles.avatarLabel, isLarge && styles.avatarLabelLarge]}>
          {initial}
        </Text>
      </View>
      <Text style={styles.rank}>#{entry.rank}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {entry.name}
      </Text>
      <Text style={[styles.points, isLarge && styles.pointsLarge]}>
        {entry.points.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  secondThirdRow: { flexDirection: "row", gap: 24, marginTop: 20 },
  flex: { flex: 1 },
  item: { alignItems: "center", width: 96 },
  itemLarge: { width: 120 },
  avatar: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.electricBlue,
  },
  avatarLarge: { width: 68, height: 68 },
  avatarSmall: { width: 52, height: 52, borderColor: colors.border },
  avatarLabel: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },
  avatarLabelLarge: { fontSize: 22 },
  rank: {
    color: colors.electricBlue,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 10,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  points: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  pointsLarge: { color: colors.textPrimary, fontSize: 15 },
});
