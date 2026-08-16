import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { colors } from "./theme";
import { Exercise, ExerciseProgress } from "./types";

type Props = {
  title: string;
  durationLabel: string;
  exercises: Exercise[];
  progress: Record<string, ExerciseProgress>;
  personalRecords: { exerciseName: string; weight: number; reps: number }[];
  onDone: () => void;
};

export function WorkoutSummary({
  title,
  durationLabel,
  exercises,
  progress,
  personalRecords,
  onDone,
}: Props) {
  const setCount = Object.values(progress).reduce(
    (sum, item) => sum + item.completedSets.length,
    0,
  );
  const volume = Object.values(progress).reduce(
    (sum, item) =>
      sum + item.completedSets.reduce((s, set) => s + set.weight * set.reps, 0),
    0,
  );
  // Basit mock kalori tahmini - gerçek hesaplama backend'e taşınacak.
  const estimatedCalories = Math.round(setCount * 17.5);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Summary</Text>
        <Text style={styles.workoutTitle}>{title}</Text>
        <Text style={styles.duration}>{durationLabel}</Text>
      </View>

      <View style={styles.grid}>
        <StatCard label="Exercises" value={`${exercises.length}`} />
        <StatCard label="Sets" value={`${setCount}`} />
        <StatCard label="Calories" value={`${estimatedCalories} kcal`} />
        <StatCard label="Volume" value={`${volume.toLocaleString()} kg`} />
      </View>

      {personalRecords.length > 0 ? (
        <View style={styles.prSection}>
          {personalRecords.map((pr) => (
            <View key={pr.exerciseName} style={styles.prCard}>
              <View style={styles.prBadge}>
                <Text style={styles.prBadgeLabel}>NEW PR</Text>
              </View>
              <Text style={styles.prExercise}>{pr.exerciseName}</Text>
              <Text style={styles.prValue}>
                {pr.weight} kg × {pr.reps} reps
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <OnboardingButton label="Done" onPress={onDone} />
      </View>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  header: { alignItems: "center", marginTop: 24 },
  title: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  workoutTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 10,
  },
  duration: {
    color: colors.electricBlue,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 32 },
  statCard: {
    width: "47%",
    borderRadius: 16,
    padding: 18,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statValue: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  prSection: { marginTop: 20, gap: 10 },
  prCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: "rgba(0,168,255,0.32)",
  },
  prBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.buttonElectricBlue,
  },
  prBadgeLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  prExercise: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
  },
  prValue: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  footer: { marginTop: "auto", paddingBottom: 16 },
});
