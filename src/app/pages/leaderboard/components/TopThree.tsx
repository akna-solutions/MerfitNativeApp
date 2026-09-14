import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
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
  const { colors } = useTheme();
  const isLarge = size === "large";
  const initial = entry.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <View style={[styles.item, isLarge && styles.itemLarge]}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: colors.card, borderColor: colors.primary },
          isLarge ? styles.avatarLarge : [styles.avatarSmall, { borderColor: colors.border }],
        ]}
      >
        <Text style={[styles.avatarLabel, { color: colors.text }, isLarge && styles.avatarLabelLarge]}>
          {initial}
        </Text>
      </View>
      <Text style={[styles.rank, { color: colors.primary }]}>#{entry.rank}</Text>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {entry.name}
      </Text>
      <Text style={[styles.points, { color: colors.textSecondary }, isLarge && [styles.pointsLarge, { color: colors.text }]]}>
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
    borderWidth: 1.5,
  },
  avatarLarge: { width: 68, height: 68 },
  avatarSmall: { width: 52, height: 52 },
  avatarLabel: { fontSize: 18, fontWeight: "700" },
  avatarLabelLarge: { fontSize: 22 },
  rank: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  points: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  pointsLarge: { fontSize: 15 },
});
