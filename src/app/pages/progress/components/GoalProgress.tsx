import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { ProgressData } from "../types";

type Props = Pick<
  ProgressData,
  | "goalType"
  | "goalLabel"
  | "goalPercent"
  | "weightDirection"
  | "workoutsCompleted"
  | "workoutsGoal"
  | "currentWeight"
  | "startingWeight"
  | "targetWeight"
>;

/** Haftalik antrenman sayisiyla izlenen hedefler; digerleri kilo ile izlenir. */
const WORKOUT_GOALS: ProgressData["goalType"][] = ["improve_fitness", "improve_endurance"];

export function GoalProgress({
  goalType,
  goalLabel,
  goalPercent,
  weightDirection,
  workoutsCompleted,
  workoutsGoal,
  currentWeight,
  startingWeight,
  targetWeight,
}: Props) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Hedef İlerlemesi</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.goalLabel, { color: colors.text }]}>{goalLabel}</Text>

        {WORKOUT_GOALS.includes(goalType) ? (
          <WorkoutGoalBody
            completed={workoutsCompleted ?? 0}
            goal={workoutsGoal ?? 0}
          />
        ) : (
          <WeightGoalBody
            percent={goalPercent ?? 0}
            direction={weightDirection}
            startingWeight={startingWeight}
            currentWeight={currentWeight}
            targetWeight={targetWeight}
          />
        )}
      </View>
    </View>
  );
}

function formatKg(value: number): string {
  return `${value.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} kg`;
}

/** Hedef kiloya kalan miktari hedefin yonune gore anlatir. */
function remainingLabel(direction: ProgressData["weightDirection"], currentWeight: number, targetWeight: number): string {
  const diff = Math.round((targetWeight - currentWeight) * 10) / 10;
  if (direction === "maintain") {
    return Math.abs(diff) <= 1
      ? "Kilonu koruyorsun"
      : `Hedef kilondan ${formatKg(Math.abs(diff))} ${diff < 0 ? "fazlasın" : "eksiksin"}`;
  }
  const reached = direction === "lose" ? diff >= 0 : diff <= 0;
  if (reached) return "Hedefine ulaştın";
  return direction === "lose" ? `${formatKg(-diff)} vermen gerekiyor` : `${formatKg(diff)} alman gerekiyor`;
}

function WeightGoalBody({
  percent,
  direction,
  startingWeight,
  currentWeight,
  targetWeight,
}: {
  percent: number;
  direction: ProgressData["weightDirection"];
  startingWeight: number;
  currentWeight: number;
  targetWeight: number;
}) {
  const { colors } = useTheme();
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <View style={styles.weightRow}>
      <View style={styles.weightTopRow}>
        <View>
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Başlangıç</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{formatKg(startingWeight)}</Text>
        </View>
        <View style={styles.alignCenter}>
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Güncel</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{formatKg(currentWeight)}</Text>
        </View>
        <View style={styles.alignEnd}>
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Hedef</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{formatKg(targetWeight)}</Text>
        </View>
      </View>
      <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
        <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: colors.primary }]} />
      </View>
      <View style={styles.weightTopRow}>
        <Text style={[styles.remaining, { color: colors.primary }]}>
          {remainingLabel(direction, currentWeight, targetWeight)}
        </Text>
        <Text style={[styles.remaining, { color: colors.textSecondary }]}>%{clamped}</Text>
      </View>
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
  alignCenter: { alignItems: "center" },
  alignEnd: { alignItems: "flex-end" },
  metaLabel: { fontSize: 11 },
  metaValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
});
