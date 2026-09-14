import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
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
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Hedef İlerlemesi</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.goalLabel, { color: colors.text }]}>{goalLabel}</Text>

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
  const { colors } = useTheme();
  const remaining = currentWeight - targetWeight;
  const label =
    remaining === 0
      ? "Hedefine ulaştın"
      : `${Math.abs(remaining).toFixed(1)} kg kaldı`;

  return (
    <View style={styles.weightRow}>
      <View style={styles.weightTopRow}>
        <View>
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Güncel</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{currentWeight} kg</Text>
        </View>
        <View style={styles.alignEnd}>
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Hedef</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{targetWeight} kg</Text>
        </View>
      </View>
      <Text style={[styles.remaining, { color: colors.primary }]}>{label}</Text>
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
  const { colors } = useTheme();
  const ratio = goal > 0 ? Math.min(1, completed / goal) : 0;
  return (
    <View style={styles.percentBody}>
      <Text style={[styles.percentValue, { color: colors.text }]}>
        {completed} / {goal} <Text style={[styles.percentUnit, { color: colors.textSecondary }]}>antrenman</Text>
      </Text>
      <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

function PercentGoalBody({ percent }: { percent: number }) {
  const { colors } = useTheme();
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <View style={styles.percentBody}>
      <Text style={[styles.percentValue, { color: colors.text }]}>{clamped}%</Text>
      <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
        <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: colors.primary }]} />
      </View>
      <Text style={[styles.remaining, { color: colors.primary }]}>%{100 - clamped} kaldı</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  goalLabel: { fontSize: 16, fontWeight: "700" },
  percentBody: { marginTop: 16 },
  percentValue: { fontSize: 22, fontWeight: "700" },
  percentUnit: { fontSize: 13, fontWeight: "600" },
  track: {
    height: 6,
    borderRadius: 3,
    marginTop: 12,
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: 3 },
  remaining: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },
  weightRow: { marginTop: 16 },
  weightTopRow: { flexDirection: "row", justifyContent: "space-between" },
  alignEnd: { alignItems: "flex-end" },
  metaLabel: { fontSize: 11 },
  metaValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
});
