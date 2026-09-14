import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { useTheme } from "../../../shared/theme/ThemeContext";
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
  const { colors } = useTheme();
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>Antrenman Özeti</Text>
        <Text style={[styles.workoutTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.duration, { color: colors.primary }]}>{durationLabel}</Text>
      </View>

      <View style={styles.grid}>
        <StatCard label="Egzersizler" value={`${exercises.length}`} />
        <StatCard label="Setler" value={`${setCount}`} />
        <StatCard label="Kalori" value={`${estimatedCalories} kcal`} />
        <StatCard label="Hacim" value={`${volume.toLocaleString()} kg`} />
      </View>

      {personalRecords.length > 0 ? (
        <View style={styles.prSection}>
          {personalRecords.map((pr) => (
            <View key={pr.exerciseName} style={[styles.prCard, { backgroundColor: colors.card }]}>
              <View style={[styles.prBadge, { backgroundColor: colors.primaryPressed }]}>
                <Text style={styles.prBadgeLabel}>YENİ REKOR</Text>
              </View>
              <Text style={[styles.prExercise, { color: colors.text }]}>{pr.exerciseName}</Text>
              <Text style={[styles.prValue, { color: colors.textSecondary }]}>
                {pr.weight} kg × {pr.reps} tekrar
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <OnboardingButton label="Bitti" onPress={onDone} />
      </View>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: { alignItems: "center", marginTop: 24 },
  title: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  workoutTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 10,
  },
  duration: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 32 },
  statCard: {
    width: "47%",
    borderRadius: 16,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 4 },
  prSection: { marginTop: 20, gap: 10 },
  prCard: {
    borderRadius: 16,
    padding: 16,
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
  },
  prBadgeLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  prExercise: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
  },
  prValue: { fontSize: 12, marginTop: 3 },
  footer: { marginTop: "auto", paddingBottom: 16 },
});
