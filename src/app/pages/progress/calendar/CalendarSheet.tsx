import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { parseDateKey, shiftMonth, toDateKey } from "../../../../shared/calendar/dates";
import { useNavigationGuard } from "../../../../shared/navigation/useNavigationGuard";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import { DaySummary } from "./DaySummary";
import { MonthlyCalendar } from "./MonthlyCalendar";
import { useMonthCalendar } from "./useMonthCalendar";

type Props = {
  visible: boolean;
  /** Acilista secili olacak gun ("yyyy-MM-dd"); yoksa bugun. */
  focusDate: string | null;
  onClose: () => void;
};

/** Ilerleme ekranindaki aylik takvim: ay gezintisi, gunluk halkalar ve secili gunun ozeti. */
export function CalendarSheet({ visible, focusDate, onClose }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const guard = useNavigationGuard();

  const localToday = toDateKey(new Date());
  const initial = parseDateKey(focusDate) ?? parseDateKey(localToday)!;
  const [selectedKey, setSelectedKey] = useState(toDateKey(initial));
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  // Her acilista (veya ana sayfadan baska bir gun secilince) o gune odaklan.
  useEffect(() => {
    if (!visible) return;
    const target = parseDateKey(focusDate) ?? parseDateKey(toDateKey(new Date()))!;
    setSelectedKey(toDateKey(target));
    setView({ year: target.getFullYear(), month: target.getMonth() });
  }, [visible, focusDate]);

  const { grid, data, days, loading, error, refresh } = useMonthCalendar(view.year, view.month, visible);
  // Sunucunun "bugun"u kullanicinin saat dilimine goredir; yuklenene kadar cihaz tarihi kullanilir.
  const todayKey = data?.today ?? localToday;
  const todayDate = parseDateKey(todayKey)!;
  const canGoNext = view.year < todayDate.getFullYear() || (view.year === todayDate.getFullYear() && view.month < todayDate.getMonth());

  const changeMonth = (delta: number) => {
    const next = shiftMonth(view.year, view.month, delta);
    setView(next);
    // Yeni ayda bugun varsa bugunu, yoksa ayin ilk gununu sec.
    const sameMonthAsToday = next.year === todayDate.getFullYear() && next.month === todayDate.getMonth();
    setSelectedKey(sameMonthAsToday ? todayKey : toDateKey(new Date(next.year, next.month, 1, 12)));
  };

  const handleSelect = useCallback(
    (key: string) => {
      setSelectedKey(key);
      const date = parseDateKey(key);
      // Komsu aya ait gune dokununca o aya gec.
      if (date && (date.getMonth() !== view.month || date.getFullYear() !== view.year)) {
        setView({ year: date.getFullYear(), month: date.getMonth() });
      }
    },
    [view.month, view.year],
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <Text style={[styles.topTitle, { color: colors.text }]}>Aktivite Takvimi</Text>
            <Pressable
              testID="calendar-close"
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Takvimi kapat"
              style={[styles.close, { backgroundColor: colors.inputBackground }]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <MonthlyCalendar
              grid={grid}
              days={days}
              todayKey={todayKey}
              selectedKey={selectedKey}
              loading={loading}
              error={error}
              canGoNext={canGoNext}
              onPrev={() => changeMonth(-1)}
              onNext={() => changeMonth(1)}
              onSelect={handleSelect}
              onRetry={refresh}
            />
            <View style={styles.summary}>
              <DaySummary
                dateKey={selectedKey}
                day={days.get(selectedKey) ?? (selectedKey > todayKey ? futurePlaceholder(selectedKey) : undefined)}
                dailyTarget={data?.dailyCalorieTarget ?? null}
                onOpenSession={guard((id: number) => {
                  onClose();
                  router.push({ pathname: "/pages/workout/history/[id]", params: { id: String(id) } } as never);
                })}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

/** Veri yuklenmeden secilen gelecek gun icin bos ozet (sahte aktivite gostermemek icin). */
function futurePlaceholder(date: string) {
  return {
    date,
    isToday: false,
    isFuture: true,
    isPlannedWorkoutDay: null,
    workout: { completed: false, totalDurationSeconds: 0, sessions: [] },
    nutrition: { logged: false, consumedCalories: 0, protein: 0, carbs: 0, fat: 0, calorieRatio: null, calorieGoalMet: false, meals: [] },
    activity: { caloriesBurned: 0, activeMinutes: 0 },
  };
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  topTitle: { fontSize: 20, fontWeight: "800" },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  summary: { marginTop: 20, paddingHorizontal: 4 },
});
