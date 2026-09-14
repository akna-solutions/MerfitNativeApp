import { Pressable, StyleSheet, Text, View } from "react-native";

import { MyPlanDay } from "../../../../services/api/types";
import { colors } from "../theme";

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
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.badge}>
        <Text style={styles.badgeLabel}>Bugün</Text>
      </View>
      <Text style={styles.title}>{day.workout.title}</Text>
      <Text style={styles.meta}>
        {day.workout.durationMin} dk · {day.exercises.length} egzersiz
      </Text>
      <View style={styles.button}>
        <Text style={styles.buttonLabel}>Antrenmana Başla</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 22,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.cardBackgroundActive,
    marginBottom: 12,
  },
  badgeLabel: { color: colors.electricBlue, fontSize: 11, fontWeight: "700" },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  button: {
    marginTop: 18,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.electricBlue,
  },
  buttonLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
