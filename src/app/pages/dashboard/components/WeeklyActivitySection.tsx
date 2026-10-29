import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { CalendarDay } from "../../../../services/api/types";
import { WEEKDAY_LETTER } from "../../../../shared/calendar/dates";
import { RING_COLORS } from "../../../../shared/calendar/ringColors";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  /** Pazartesiden Pazara 7 gunun anahtarlari ("yyyy-MM-dd"). */
  weekKeys: string[];
  days: Map<string, CalendarDay>;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onDayPress: (dateKey: string) => void;
};

type WorkoutState = "done" | "missed" | "rest" | "future" | "none";
type CalorieState = "met" | "partial" | "future" | "none";

export function workoutState(day: CalendarDay | undefined): WorkoutState {
  if (!day) return "none";
  if (day.workout.completed) return "done";
  if (day.isFuture) return "future";
  if (day.isPlannedWorkoutDay === false) return "rest";
  if (day.isPlannedWorkoutDay === true && !day.isToday) return "missed";
  return "none";
}

/** Kalori satiri gercek kurala (alinan / hedef, NutritionInsightEvaluator esikleri) gore doldurulur. */
export function calorieState(day: CalendarDay | undefined): CalorieState {
  if (!day) return "none";
  if (day.isFuture) return "future";
  if (day.nutrition.calorieGoalMet) return "met";
  if (day.nutrition.logged) return "partial";
  return "none";
}

const WORKOUT_LABEL: Record<WorkoutState, string> = {
  done: "antrenman yapıldı",
  missed: "planlanan antrenman yapılmadı",
  rest: "dinlenme günü",
  future: "henüz gelmedi",
  none: "antrenman yok",
};

const CALORIE_LABEL: Record<CalorieState, string> = {
  met: "kalori hedefi tamamlandı",
  partial: "öğün kaydı var, hedef tamamlanmadı",
  future: "henüz gelmedi",
  none: "öğün kaydı yok",
};

/**
 * Ana sayfadaki haftalik aktivite: ustte antrenman, altta kalori hedefi satiri. Veriler
 * GET /api/progress/calendar'dan gelir; bugun vurgulanir ve bir gune dokununca Ilerleme ekraninda
 * o gunun ozeti acilir.
 */
export function WeeklyActivitySection({ weekKeys, days, loading, error, onRetry, onDayPress }: Props) {
  const { colors } = useTheme();
  const doneCount = weekKeys.filter((key) => days.get(key)?.workout.completed).length;
  const metCount = weekKeys.filter((key) => days.get(key)?.nutrition.calorieGoalMet).length;

  const renderWorkoutDot = (state: WorkoutState) => {
    if (state === "done") {
      return (
        <View style={[styles.dot, { backgroundColor: colors.primary }]}>
          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
        </View>
      );
    }
    if (state === "rest") {
      return (
        <View style={[styles.dot, styles.outline, { borderColor: colors.border }]}>
          <Ionicons name="moon" size={11} color={colors.textSecondary} />
        </View>
      );
    }
    if (state === "missed") {
      return <View style={[styles.dot, styles.outline, { borderColor: colors.primary }]} />;
    }
    return <View style={[styles.dot, { backgroundColor: colors.inputBackground, opacity: state === "future" ? 0.5 : 1 }]} />;
  };

  const renderCalorieDot = (state: CalorieState) => {
    if (state === "met") {
      return (
        <View style={[styles.dot, { backgroundColor: RING_COLORS.nutrition }]}>
          <Ionicons name="flame" size={12} color="#FFFFFF" />
        </View>
      );
    }
    if (state === "partial") {
      return <View style={[styles.dot, styles.outline, { borderColor: RING_COLORS.nutrition }]} />;
    }
    return <View style={[styles.dot, { backgroundColor: colors.inputBackground, opacity: state === "future" ? 0.5 : 1 }]} />;
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Haftalık Aktivite</Text>
        {!loading && !error ? (
          <Text style={[styles.summary, { color: colors.textSecondary }]}>
            {doneCount} antrenman · {metCount} kalori hedefi
          </Text>
        ) : null}
      </View>

      <View testID="weekly-activity" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {loading && days.size === 0 ? (
          <View style={styles.state}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error && days.size === 0 ? (
          <Pressable style={styles.state} onPress={onRetry} accessibilityRole="button">
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>Haftalık aktivite yüklenemedi.</Text>
            <Text style={[styles.retry, { color: colors.primary }]}>Tekrar dene</Text>
          </Pressable>
        ) : (
          <View style={styles.grid}>
            <View style={styles.labels} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <View style={styles.labelSpacer} />
              <View style={styles.labelIcon}>
                <Ionicons name="barbell-outline" size={15} color={colors.textSecondary} />
              </View>
              <View style={styles.labelIcon}>
                <Ionicons name="flame-outline" size={15} color={colors.textSecondary} />
              </View>
            </View>
            {weekKeys.map((key, index) => {
              const day = days.get(key);
              const ws = workoutState(day);
              const cs = calorieState(day);
              const isToday = day?.isToday === true;
              return (
                <Pressable
                  key={key}
                  testID={`weekly-day-${key}`}
                  onPress={() => onDayPress(key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isToday }}
                  accessibilityLabel={`${WEEKDAY_LETTER[index]}${isToday ? ", bugün" : ""}: ${WORKOUT_LABEL[ws]}, ${CALORIE_LABEL[cs]}`}
                  style={({ pressed }) => [
                    styles.column,
                    isToday && { backgroundColor: colors.cardActive, borderColor: colors.borderActive },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.dayLabel, { color: isToday ? colors.primary : colors.textSecondary }]}>
                    {WEEKDAY_LETTER[index]}
                  </Text>
                  {renderWorkoutDot(ws)}
                  {renderCalorieDot(cs)}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const DOT = 26;

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  summary: { fontSize: 12 },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 12, paddingHorizontal: 8 },
  state: { minHeight: 96, alignItems: "center", justifyContent: "center", gap: 6 },
  stateText: { fontSize: 13 },
  retry: { fontSize: 13, fontWeight: "700" },
  grid: { flexDirection: "row", alignItems: "stretch" },
  labels: { width: 22, alignItems: "center", paddingVertical: 7, gap: 10 },
  labelSpacer: { height: 14 },
  labelIcon: { height: 26, justifyContent: "center" },
  column: {
    flex: 1,
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  dayLabel: { fontSize: 11, fontWeight: "700", height: 14 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, alignItems: "center", justifyContent: "center" },
  outline: { borderWidth: 2, backgroundColor: "transparent" },
});
