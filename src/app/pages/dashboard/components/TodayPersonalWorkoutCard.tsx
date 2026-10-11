import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MyPlanDay } from "../../../../services/api/types";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import { normalizeWorkoutAttributeScores } from "../../../../shared/workoutAttributes/attributes";
import { WorkoutAttributeBars } from "../../../../shared/workoutAttributes/WorkoutAttributeBars";

type Props = {
  day: MyPlanDay;
  /** Bugunun plan antrenmani zaten tamamlandiysa kart "tamamlandi" durumunu gosterir. */
  isCompletedToday?: boolean;
  onPress: () => void;
};

/**
 * Dashboard'da "Bugünün Antrenmanı" bolumunu, genel oneri (WorkoutCard) yerine kullanicinin
 * gercek kisisel planindan (GET /api/my-plan/today) gelen veriyle gosterir. Faz 2 gereksinimi:
 * "Bugünün antrenmanı gerçek kişisel plan üzerinden gelmeli."
 */
export function TodayPersonalWorkoutCard({ day, isCompletedToday = false, onPress }: Props) {
  const { colors } = useTheme();
  // Puanlar yalnizca bu gunun antrenmanina (day.workout) aittir; backend gondermiyorsa bos kalir.
  const attributeScores = useMemo(
    () => normalizeWorkoutAttributeScores(day.workout.attributeScores),
    [day.workout.attributeScores],
  );

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        isCompletedToday
          ? `Bugünün antrenmanı tamamlandı: ${day.workout.title}. Tekrar başla`
          : `Bugünün antrenmanı: ${day.workout.title}. Antrenmana başla`
      }
    >
      <View style={[styles.badge, { backgroundColor: colors.cardActive }]}>
        <Text style={[styles.badgeLabel, { color: colors.primary }]}>
          {isCompletedToday ? "Bugün · Tamamlandı ✓" : "Bugün"}
        </Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{day.workout.title}</Text>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {day.workout.durationMin} dk · {day.exercises.length} egzersiz
      </Text>
      <Text style={[styles.note, { color: colors.textSecondary }]}>
        Hedefine göre hazırlanan kişisel programından.
      </Text>
      {attributeScores.length > 0 ? (
        <View style={styles.attributes}>
          <WorkoutAttributeBars scores={attributeScores} compact />
        </View>
      ) : null}
      {isCompletedToday ? (
        <View style={[styles.button, styles.buttonDone, { borderColor: colors.border }]}>
          <Text style={[styles.buttonLabel, { color: colors.text }]}>Tekrar Başla</Text>
        </View>
      ) : (
        <View style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={styles.buttonLabel}>Antrenmana Başla</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  badgeLabel: { fontSize: 11, fontWeight: "700" },
  title: { fontSize: 18, fontWeight: "700" },
  meta: { fontSize: 13, marginTop: 4 },
  note: { fontSize: 12, marginTop: 8 },
  attributes: { marginTop: 16 },
  button: {
    marginTop: 18,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDone: { borderWidth: StyleSheet.hairlineWidth },
  buttonLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
