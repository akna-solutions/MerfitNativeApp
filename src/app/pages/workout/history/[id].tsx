import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "../../../../services/api/client";
import { WorkoutSession, WorkoutSessionExercise } from "../../../../services/api/types";
import { getWorkoutSession } from "../../../../services/api/workoutSessions";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import { formatHistoryDate, formatKg, formatMinutes } from "../../../../shared/workoutHistory/format";

/** Gecmis bir antrenmanin egzersiz/set bazinda detayi: hangi sette kac kg ile kac tekrar yapildi. */
export default function WorkoutHistoryDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getWorkoutSession(Number(id), controller.signal)
      .then(setSession)
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.isUnauthorized) {
          router.replace("/pages/login");
          return;
        }
        setErrorMessage(error instanceof ApiError ? error.message : "Antrenman detayı yüklenemedi.");
      });
    return () => controller.abort();
  }, [id, router]);

  const performed = session?.exercises.filter((ex) => ex.completedSets.length > 0) ?? [];
  const skipped = session?.exercises.filter((ex) => ex.completedSets.length === 0) ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/pages/workout/history"))}
            hitSlop={12}
            style={[styles.backButton, { backgroundColor: colors.inputBackground }]}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {session?.title || "Antrenman"}
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.centered}>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>{errorMessage}</Text>
          </View>
        ) : !session ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>
              {[
                session.completedAt ? formatHistoryDate(session.completedAt) : null,
                formatMinutes(session.durationSeconds),
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>

            {performed.map((exercise) => (
              <ExerciseCard key={exercise.sessionExerciseId} exercise={exercise} />
            ))}

            {skipped.length > 0 ? (
              <Text style={[styles.skipped, { color: colors.textSecondary }]}>
                Yapılmayan: {skipped.map((ex) => ex.name).join(", ")}
              </Text>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function ExerciseCard({ exercise }: { exercise: WorkoutSessionExercise }) {
  const { colors } = useTheme();
  const volume = exercise.completedSets.reduce(
    (sum, set) => sum + (set.weightKg ?? 0) * (set.reps ?? 0),
    0,
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
      {exercise.completedSets.map((set) => (
        <View key={set.setNumber} style={[styles.setRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.setLabel, { color: colors.textSecondary }]}>Set {set.setNumber}</Text>
          <Text style={[styles.setValue, { color: colors.text }]}>
            {set.weightKg && set.weightKg > 0 ? formatKg(set.weightKg) : "Vücut ağırlığı"}
            {set.reps ? ` × ${set.reps}` : ""}
          </Text>
        </View>
      ))}
      {volume > 0 ? (
        <Text style={[styles.volume, { color: colors.textSecondary }]}>Hacim: {formatKg(volume)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  muted: { fontSize: 13, textAlign: "center" },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  exerciseName: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  setLabel: { fontSize: 13 },
  setValue: { fontSize: 13, fontWeight: "700" },
  volume: { fontSize: 12, marginTop: 8 },
  skipped: { fontSize: 12, marginTop: 4 },
});
