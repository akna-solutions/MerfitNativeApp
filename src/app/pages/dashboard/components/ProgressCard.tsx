import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { TodayProgress } from "../types";

type Props = { progress: TodayProgress };

export function ProgressCard({ progress }: Props) {
  const ratio = Math.min(
    1,
    progress.workoutsTarget > 0
      ? progress.workoutsCompleted / progress.workoutsTarget
      : 0,
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Bugünkü İlerleme</Text>

      <Text style={styles.count}>
        {progress.workoutsCompleted}{" "}
        <Text style={styles.countMuted}>
          / {progress.workoutsTarget} antrenman
        </Text>
      </Text>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progress.calories}</Text>
          <Text style={styles.statLabel}>kcal</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: { color: colors.textPrimary, fontSize: 15, fontWeight: "700" },
  count: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 10,
  },
  countMuted: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.progressTrack,
    marginTop: 14,
    overflow: "hidden",
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.electricBlue,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: colors.textPrimary, fontSize: 15, fontWeight: "700" },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.border,
  },
});
