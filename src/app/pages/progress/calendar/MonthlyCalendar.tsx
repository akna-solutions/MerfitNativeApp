import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { CalendarDay } from "../../../../services/api/types";
import { ActivityRings } from "../../../../shared/calendar/ActivityRings";
import { MONTH_NAMES, MonthGrid, WEEKDAY_SHORT } from "../../../../shared/calendar/dates";
import { dayRingValues } from "../../../../shared/calendar/dayRings";
import { ACTIVE_MINUTES_REFERENCE, RING_COLORS } from "../../../../shared/calendar/ringColors";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  grid: MonthGrid;
  days: Map<string, CalendarDay>;
  todayKey: string;
  selectedKey: string;
  loading: boolean;
  error: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (key: string) => void;
  onRetry: () => void;
};

const RING_SIZE = 34;

type CellProps = {
  dateKey: string;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
  day: CalendarDay | undefined;
  onSelect: (key: string) => void;
};

const DayCell = memo(function DayCell({ dateKey, dayNumber, inMonth, isToday, isSelected, isFuture, day, onSelect }: CellProps) {
  const { colors } = useTheme();
  const values = dayRingValues(day);
  const parts = [
    `${dayNumber}`,
    isToday ? "bugün" : null,
    values.workout ? "antrenman yapıldı" : null,
    values.activity !== null ? "aktivite var" : null,
    day?.nutrition.calorieGoalMet ? "kalori hedefi tamam" : day?.nutrition.logged ? "öğün kaydı var" : null,
  ].filter(Boolean);

  return (
    <Pressable
      testID={`calendar-day-${dateKey}`}
      onPress={() => onSelect(dateKey)}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={parts.join(", ")}
      style={[
        styles.cell,
        isSelected && { backgroundColor: colors.cardActive, borderColor: colors.primary },
        !isSelected && isToday && { borderColor: colors.borderActive },
        !inMonth && styles.outOfMonth,
      ]}
    >
      <View style={styles.ringBox}>
        <ActivityRings values={values} size={RING_SIZE} testID={`calendar-rings-${dateKey}`} />
        <Text
          style={[
            styles.dayNumber,
            { color: isToday ? colors.primary : isFuture ? colors.textSecondary : colors.text },
            (isToday || isSelected) && styles.dayNumberStrong,
          ]}
        >
          {dayNumber}
        </Text>
      </View>
    </Pressable>
  );
});

/** Pazartesi baslangicli aylik takvim izgarasi; her gunde yalnizca gercek verisi olan halkalar cizilir. */
export function MonthlyCalendar({
  grid, days, todayKey, selectedKey, loading, error, canGoNext, onPrev, onNext, onSelect, onRetry,
}: Props) {
  const { colors } = useTheme();

  return (
    <View>
      <View style={styles.header}>
        <Pressable
          testID="calendar-prev"
          onPress={onPrev}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Önceki ay"
          style={[styles.navButton, { backgroundColor: colors.inputBackground }]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text testID="calendar-month-title" style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            {MONTH_NAMES[grid.month]} {grid.year}
          </Text>
          {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>
        <Pressable
          testID="calendar-next"
          onPress={onNext}
          disabled={!canGoNext}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Sonraki ay"
          accessibilityState={{ disabled: !canGoNext }}
          style={[styles.navButton, { backgroundColor: colors.inputBackground, opacity: canGoNext ? 1 : 0.35 }]}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_SHORT.map((label) => (
          <Text key={label} style={[styles.weekday, { color: colors.textSecondary }]}>{label}</Text>
        ))}
      </View>

      {grid.weeks.map((week) => (
        <View key={week[0].key} style={styles.weekRow}>
          {week.map((cell) => (
            <DayCell
              key={cell.key}
              dateKey={cell.key}
              dayNumber={cell.day}
              inMonth={cell.inMonth}
              isToday={cell.key === todayKey}
              isSelected={cell.key === selectedKey}
              isFuture={cell.key > todayKey}
              day={days.get(cell.key)}
              onSelect={onSelect}
            />
          ))}
        </View>
      ))}

      {error ? (
        <Pressable onPress={onRetry} accessibilityRole="button" style={styles.errorRow}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Takvim verisi yüklenemedi. </Text>
          <Text style={[styles.errorText, { color: colors.primary, fontWeight: "700" }]}>Tekrar dene</Text>
        </Pressable>
      ) : null}

      <View style={styles.legend}>
        {[
          { label: "Antrenman", color: colors.primary },
          { label: `Aktivite (${ACTIVE_MINUTES_REFERENCE} dk)`, color: RING_COLORS.activity },
          { label: "Kalori hedefi", color: RING_COLORS.nutrition },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { borderColor: item.color }]} />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  navButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  titleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 18, fontWeight: "800" },
  weekRow: { flexDirection: "row" },
  weekday: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", marginBottom: 6 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
    margin: 1,
  },
  outOfMonth: { opacity: 0.35 },
  ringBox: { width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center" },
  dayNumber: { position: "absolute", fontSize: 12, fontWeight: "600" },
  dayNumberStrong: { fontWeight: "800" },
  errorRow: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  errorText: { fontSize: 13 },
  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2.5 },
  legendLabel: { fontSize: 11 },
});
