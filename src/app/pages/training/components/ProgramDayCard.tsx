import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { TrainingDay, TrainingExercise } from "../../../../services/api/types";
import { DAY_NAMES_TR, formatPrescription } from "../../../../shared/training/format";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  day: TrainingDay;
  /** Aktif programda gun baslatilabilir ve egzersiz degistirilebilir; onerilen versiyonda yalnizca goruntulenir. */
  editable: boolean;
  initiallyExpanded?: boolean;
  onStart?: (day: TrainingDay) => void;
  onSwap?: (exercise: TrainingExercise, newExerciseId: number, newName: string) => void;
};

export function ProgramDayCard({ day, editable, initiallyExpanded = false, onStart, onSwap }: Props) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [openAlternatives, setOpenAlternatives] = useState<number | null>(null);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button" accessibilityLabel={`${day.title} günü`}>
        <View style={styles.top}>
          <Text style={[styles.dayName, { color: colors.textSecondary }]}>{DAY_NAMES_TR[day.dayOfWeek] ?? day.dayOfWeek}</Text>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{day.title}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          ~{day.estimatedMinutes} dk · {day.exercises.length} egzersiz
        </Text>
      </Pressable>

      {expanded ? (
        <View style={styles.exercises}>
          {[...day.exercises]
            .sort((a, b) => a.order - b.order)
            .map((exercise) => (
              <View key={exercise.planExerciseId} style={[styles.exercise, { borderColor: colors.border }]}>
                <View style={styles.exerciseTop}>
                  <View style={styles.flex}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {exercise.order}. {exercise.name}
                    </Text>
                    <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>
                      {[exercise.targetMuscle, exercise.mechanic === "Compound" ? "Bileşik" : exercise.mechanic === "Isolation" ? "İzolasyon" : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                  {editable && onSwap && exercise.alternatives.length > 0 ? (
                    <Pressable
                      onPress={() => setOpenAlternatives(openAlternatives === exercise.planExerciseId ? null : exercise.planExerciseId)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`${exercise.name} için alternatifler`}
                    >
                      <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
                    </Pressable>
                  ) : null}
                </View>
                <Text style={[styles.prescription, { color: colors.text }]}>{formatPrescription(exercise)}</Text>
                {exercise.weightInstruction ? (
                  <Text style={[styles.instruction, { color: colors.textSecondary }]}>{exercise.weightInstruction}</Text>
                ) : null}

                {openAlternatives === exercise.planExerciseId ? (
                  <View style={styles.alternatives}>
                    <Text style={[styles.altTitle, { color: colors.textSecondary }]}>
                      Veritabanındaki alternatifler (değişiklik yeni bir versiyon oluşturur)
                    </Text>
                    {exercise.alternatives.map((alt) => (
                      <Pressable
                        key={alt.exerciseId}
                        onPress={() => onSwap?.(exercise, alt.exerciseId, alt.name)}
                        style={[styles.alt, { borderColor: colors.border }]}
                        accessibilityRole="button"
                      >
                        <View style={styles.flex}>
                          <Text style={[styles.exerciseName, { color: colors.text }]}>{alt.name}</Text>
                          {alt.reason ? <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>{alt.reason}</Text> : null}
                        </View>
                        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          {editable && onStart ? (
            <Pressable style={[styles.start, { backgroundColor: colors.primary }]} onPress={() => onStart(day)} accessibilityRole="button">
              <Text style={styles.startLabel}>Antrenmana Başla</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayName: { fontSize: 12, fontWeight: "700" },
  title: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  meta: { fontSize: 12, marginTop: 2 },
  exercises: { marginTop: 12, gap: 10 },
  exercise: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 4 },
  exerciseTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  flex: { flex: 1 },
  exerciseName: { fontSize: 13, fontWeight: "700" },
  exerciseMeta: { fontSize: 11, marginTop: 1 },
  prescription: { fontSize: 12, fontWeight: "600" },
  instruction: { fontSize: 11, lineHeight: 16 },
  alternatives: { marginTop: 6, gap: 6 },
  altTitle: { fontSize: 11, fontWeight: "600" },
  alt: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, padding: 10 },
  start: { marginTop: 4, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  startLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
