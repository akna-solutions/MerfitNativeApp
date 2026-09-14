import { Pressable, StyleSheet, Text, View } from "react-native";

import { MyPlanDay } from "../../../../services/api/types";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  day: MyPlanDay;
  onPress: () => void;
};

/**
 * Dashboard'da "Bugünün Antrenmanı" bolumunu, genel oneri (WorkoutCard) yerine kullanicinin
 * gercek kisisel planindan (GET /api/my-plan/today) gelen veriyle gosterir. Faz 2 gereksinimi:
 * "Bugünün antrenmanı gerçek kişisel plan üzerinden gelmeli."
 */
export function TodayPersonalWorkoutCard({ day, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
      <View style={[styles.badge, { backgroundColor: colors.cardActive }]}>
        <Text style={[styles.badgeLabel, { color: colors.primary }]}>Bugün</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{day.workout.title}</Text>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {day.workout.durationMin} dk · {day.exercises.length} egzersiz
      </Text>
      <View style={[styles.button, { backgroundColor: colors.primary }]}>
        <Text style={styles.buttonLabel}>Antrenmana Başla</Text>
      </View>
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
  button: {
    marginTop: 18,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
