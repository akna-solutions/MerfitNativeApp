import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { GoalProgress } from "../types";

type Props = { goal: GoalProgress };

export function GoalProgressCard({ goal }: Props) {
  const { currentWeightKg, goalWeightKg, startWeightKg } = goal;
  const totalDistance = Math.abs(startWeightKg - goalWeightKg);
  const covered = Math.abs(startWeightKg - currentWeightKg);
  const ratio = totalDistance > 0 ? Math.min(1, covered / totalDistance) : 0;
  const remaining = currentWeightKg - goalWeightKg;
  const remainingLabel =
    remaining === 0
      ? "You reached your goal"
      : `${remaining > 0 ? "-" : "+"}${Math.abs(remaining).toFixed(1)} kg to goal`;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>Your Progress</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Weight</Text>
            <Text style={styles.value}>{currentWeightKg} kg</Text>
          </View>
          <View style={styles.alignEnd}>
            <Text style={styles.label}>Goal</Text>
            <Text style={styles.value}>{goalWeightKg} kg</Text>
          </View>
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        </View>

        <Text style={styles.remaining}>{remainingLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 28 },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  alignEnd: { alignItems: "flex-end" },
  label: { color: colors.textMuted, fontSize: 11 },
  value: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.progressTrack,
    marginTop: 16,
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.electricBlue },
  remaining: {
    color: colors.electricBlue,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },
});
