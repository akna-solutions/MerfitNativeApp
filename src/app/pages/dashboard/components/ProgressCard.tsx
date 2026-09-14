import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { TodayProgress } from "../types";

type Props = { progress: TodayProgress };

export function ProgressCard({ progress }: Props) {
  const { colors } = useTheme();
  const ratio = Math.min(
    1,
    progress.workoutsTarget > 0
      ? progress.workoutsCompleted / progress.workoutsTarget
      : 0,
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Bugünkü İlerleme</Text>

      <Text style={[styles.count, { color: colors.text }]}>
        {progress.workoutsCompleted}{" "}
        <Text style={[styles.countMuted, { color: colors.textSecondary }]}>
          / {progress.workoutsTarget} antrenman
        </Text>
      </Text>

      <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: colors.primary }]} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{progress.calories}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>kcal</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 15, fontWeight: "700" },
  count: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 10,
  },
  countMuted: { fontSize: 14, fontWeight: "600" },
  track: {
    height: 6,
    borderRadius: 3,
    marginTop: 14,
    overflow: "hidden",
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 15, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 3 },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
});
