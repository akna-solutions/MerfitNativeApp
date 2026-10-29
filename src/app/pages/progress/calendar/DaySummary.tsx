import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CalendarDay } from "../../../../services/api/types";
import { formatLongDate } from "../../../../shared/calendar/dates";
import { hasAnyRecord } from "../../../../shared/calendar/dayRings";
import { RING_COLORS } from "../../../../shared/calendar/ringColors";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  dateKey: string;
  day: CalendarDay | undefined;
  dailyTarget: number | null;
  onOpenSession: (sessionId: number) => void;
};

const minutes = (seconds: number | null | undefined) => Math.max(0, Math.round((seconds ?? 0) / 60));

export const EMPTY_DAY_TEXT = "Bu gün için henüz kayıt bulunmuyor.";

/** Takvimde secilen gunun ozeti: antrenman, ogunler ve makrolar, aktivite. Alinan ve harcanan kalori ayri gosterilir. */
export function DaySummary({ dateKey, day, dailyTarget, onOpenSession }: Props) {
  const { colors } = useTheme();

  const header = (
    <Text style={[styles.date, { color: colors.text }]} accessibilityRole="header">
      {formatLongDate(dateKey)}
      {day?.isToday ? <Text style={{ color: colors.primary }}> · Bugün</Text> : null}
    </Text>
  );

  if (day?.isFuture) {
    return (
      <View testID="day-summary" style={styles.wrapper}>
        {header}
        <Text style={[styles.empty, { color: colors.textSecondary }]}>Bu gün henüz gelmedi.</Text>
      </View>
    );
  }

  if (!hasAnyRecord(day)) {
    return (
      <View testID="day-summary" style={styles.wrapper}>
        {header}
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="calendar-clear-outline" size={22} color={colors.textSecondary} />
          <Text testID="day-summary-empty" style={[styles.empty, { color: colors.textSecondary }]}>{EMPTY_DAY_TEXT}</Text>
        </View>
      </View>
    );
  }

  const d = day as CalendarDay;

  return (
    <View testID="day-summary" style={styles.wrapper}>
      {header}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.swatch, { backgroundColor: colors.primary }]} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Antrenman</Text>
        </View>
        {d.workout.sessions.length === 0 ? (
          <Text style={[styles.muted, { color: colors.textSecondary }]}>
            {d.isPlannedWorkoutDay === false ? "Dinlenme günü." : "Antrenman kaydı yok."}
          </Text>
        ) : (
          d.workout.sessions.map((session) => (
            <Pressable
              key={session.id}
              testID={`day-session-${session.id}`}
              onPress={() => onOpenSession(session.id)}
              accessibilityRole="button"
              accessibilityLabel={`${session.title}, ${minutes(session.durationSeconds)} dakika, ${session.setCount} set. Detayı aç`}
              style={({ pressed }) => [styles.sessionRow, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={styles.flex}>
                <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{session.title || "Antrenman"}</Text>
                <Text style={[styles.muted, { color: colors.textSecondary }]}>
                  {minutes(session.durationSeconds)} dk · {session.exerciseCount} egzersiz · {session.setCount} set
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
          ))
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.swatch, { backgroundColor: RING_COLORS.nutrition }]} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Beslenme</Text>
          <Text style={[styles.cardMeta, { color: d.nutrition.calorieGoalMet ? RING_COLORS.nutrition : colors.textSecondary }]}>
            {d.nutrition.calorieGoalMet ? "Hedef tamam ✓" : ""}
          </Text>
        </View>
        {d.nutrition.logged ? (
          <>
            <Text style={[styles.big, { color: colors.text }]}>
              {d.nutrition.consumedCalories}
              <Text style={[styles.bigUnit, { color: colors.textSecondary }]}>
                {dailyTarget ? ` / ${dailyTarget} kcal alındı` : " kcal alındı"}
              </Text>
            </Text>
            <View style={styles.macros}>
              {[
                { label: "Protein", value: d.nutrition.protein },
                { label: "Karbonhidrat", value: d.nutrition.carbs },
                { label: "Yağ", value: d.nutrition.fat },
              ].map((macro) => (
                <View key={macro.label} style={[styles.macro, { backgroundColor: colors.inputBackground }]}>
                  <Text style={[styles.macroValue, { color: colors.text }]}>{macro.value} g</Text>
                  <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>{macro.label}</Text>
                </View>
              ))}
            </View>
            {d.nutrition.meals.map((meal) => (
              <View key={meal.type} style={[styles.mealRow, { borderColor: colors.border }]}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{meal.type}</Text>
                <Text style={[styles.muted, { color: colors.textSecondary }]}>
                  {meal.itemCount} besin · {meal.calories} kcal
                </Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={[styles.muted, { color: colors.textSecondary }]}>Öğün kaydı yok.</Text>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.swatch, { backgroundColor: RING_COLORS.activity }]} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Aktivite</Text>
        </View>
        {d.activity.activeMinutes > 0 ? (
          <View style={styles.activityRow}>
            <View>
              <Text style={[styles.big, { color: colors.text }]}>{d.activity.caloriesBurned}<Text style={[styles.bigUnit, { color: colors.textSecondary }]}> kcal yakıldı</Text></Text>
              <Text style={[styles.muted, { color: colors.textSecondary }]}>Antrenmanlardan tahmini</Text>
            </View>
            <View style={styles.alignEnd}>
              <Text style={[styles.big, { color: colors.text }]}>{d.activity.activeMinutes}<Text style={[styles.bigUnit, { color: colors.textSecondary }]}> dk</Text></Text>
              <Text style={[styles.muted, { color: colors.textSecondary }]}>Aktif süre</Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.muted, { color: colors.textSecondary }]}>Aktivite kaydı yok.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12 },
  flex: { flex: 1 },
  date: { fontSize: 17, fontWeight: "800" },
  emptyCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 20, alignItems: "center", gap: 8 },
  empty: { fontSize: 14, textAlign: "center" },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 8 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  cardTitle: { fontSize: 14, fontWeight: "800", flex: 1 },
  cardMeta: { fontSize: 12, fontWeight: "700" },
  sessionRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  rowTitle: { fontSize: 14, fontWeight: "700" },
  muted: { fontSize: 12 },
  big: { fontSize: 20, fontWeight: "800" },
  bigUnit: { fontSize: 12, fontWeight: "600" },
  macros: { flexDirection: "row", gap: 8 },
  macro: { flex: 1, borderRadius: 12, paddingVertical: 8, alignItems: "center" },
  macroValue: { fontSize: 14, fontWeight: "800" },
  macroLabel: { fontSize: 10, marginTop: 2 },
  mealRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  activityRow: { flexDirection: "row", justifyContent: "space-between" },
  alignEnd: { alignItems: "flex-end" },
});
