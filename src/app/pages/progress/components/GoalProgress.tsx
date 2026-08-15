import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { ProgressData } from "../types";

type Props = Pick<
  ProgressData,
  | "goalType"
  | "goalLabel"
  | "goalPercent"
  | "workoutsCompleted"
  | "workoutsGoal"
  | "currentWeight"
  | "targetWeight"
>;

export function GoalProgress({
  goalType,
  goalLabel,
  goalPercent,
  workoutsCompleted,
  workoutsGoal,
  currentWeight,
  targetWeight,
}: Props) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Goal Progress</Text>

      <View style={styles.card}>
        <Text style={styles.goalLabel}>{goalLabel}</Text>

        {goalType === "lose_weight" || goalType === "maintain_weight" ? (
          <WeightGoalBody
            currentWeight={currentWeight}
            targetWeight={targetWeight}
          />
        ) : goalType === "improve_fitness" ? (
          <WorkoutGoalBody
            completed={workoutsCompleted ?? 0}
            goal={workoutsGoal ?? 0}
          />
        ) : (
          <PercentGoalBody percent={goalPercent ?? 0} />
        )}
      </View>
    </View>
  );
}

function WeightGoalBody({
  currentWeight,
  targetWeight,
}: {
  currentWeight: number;
  targetWeight: number;
}) {
  const remaining = currentWeight - targetWeight;
  const label =
    remaining === 0
      ? "You reached your goal"
      : `${Math.abs(remaining).toFixed(1)} kg to go`;

  return (
    <View style={styles.weightRow}>
      <View style={styles.weightTopRow}>
        <View>
          <Text style={styles.metaLabel}>Current</Text>
          <Text style={styles.metaValue}>{currentWeight} kg</Text>
        </View>
        <View style={styles.alignEnd}>
          <Text style={styles.metaLabel}>Target</Text>
          <Text style={styles.metaValue}>{targetWeight} kg</Text>
        </View>
      </View>
      <Text style={styles.remaining}>{label}</Text>
    </View>
  );
}

function WorkoutGoalBody({
  completed,
  goal,
}: {
  completed: number;
  goal: number;
}) {
  const ratio = goal > 0 ? Math.min(1, completed / goal) : 0;
  return (
    <View style={styles.percentBody}>
      <Text style={styles.percentValue}>
        {completed} / {goal} <Text style={styles.percentUnit}>workouts</Text>
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

function PercentGoalBody({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <View style={styles.percentBody}>
      <Text style={styles.percentValue}>{clamped}%</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
      <Text style={styles.remaining}>{100 - clamped}% remaining</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  goalLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  percentBody: { marginTop: 16 },
  percentValue: { color: colors.textPrimary, fontSize: 22, fontWeight: "700" },
  percentUnit: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.progressTrack,
    marginTop: 12,
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.electricBlue },
  remaining: {
    color: colors.electricBlue,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },
  weightRow: { marginTop: 16 },
  weightTopRow: { flexDirection: "row", justifyContent: "space-between" },
  alignEnd: { alignItems: "flex-end" },
  metaLabel: { color: colors.textMuted, fontSize: 11 },
  metaValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
});
