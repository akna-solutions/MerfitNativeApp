import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DumbbellSpinner } from "../../../shared/motion/DumbbellSpinner";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "../../../services/api/client";
import { getMyPlan, getTodayPlan } from "../../../services/api/myPlan";
import {
  MyPlanDay,
  MyPlanExercise,
  MyPlanWorkout,
  MyTodayWorkoutPlanResponse,
  MyWorkoutPlanResponse,
} from "../../../services/api/types";
import { usePersonalizationStatus } from "../../../shared/personalization/usePersonalizationStatus";
import { GOAL_LABELS, Goal } from "../../../shared/profile/types";
import { useTheme } from "../../../shared/theme/ThemeContext";

// Backend DayOfWeek.ToString() degerleri, Pazartesi'den baslayacak sekilde.
const WEEK_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_NAMES: Record<string, string> = {
  Monday: "Pazartesi",
  Tuesday: "Salı",
  Wednesday: "Çarşamba",
  Thursday: "Perşembe",
  Friday: "Cuma",
  Saturday: "Cumartesi",
  Sunday: "Pazar",
};
const JS_DAY_TO_NAME = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Profil API'si hedefi BUILD_MUSCLE gibi, plan API'si ise enum adi (BuildMuscle) olarak dondurur.
// Eski hedefler Kas Gelistirme olarak gosterilir (backend ile ayni esleme).
const PLAN_GOAL_TO_GOAL: Record<string, Goal> = {
  LoseWeight: "LOSE_WEIGHT",
  BuildMuscle: "BUILD_MUSCLE",
  GetStronger: "GET_STRONGER",
  MaintainWeight: "BUILD_MUSCLE",
  ImproveEndurance: "BUILD_MUSCLE",
  ImproveFitness: "BUILD_MUSCLE",
};

function formatExercise(exercise: MyPlanExercise): string {
  if (exercise.durationSeconds && exercise.durationSeconds > 0) {
    const seconds = exercise.durationSeconds;
    const amount = seconds >= 60 && seconds % 60 === 0 ? `${seconds / 60} dk` : `${seconds} sn`;
    return `${exercise.sets} × ${amount}`;
  }
  if (!exercise.reps) return `${exercise.sets} set`;
  const reps = exercise.repsMax && exercise.repsMax > exercise.reps ? `${exercise.reps}-${exercise.repsMax}` : `${exercise.reps}`;
  return `${exercise.sets} × ${reps}`;
}

/** Kullanicinin aktif kisisel antrenman programinin haftalik gorunumu (GET /api/my-plan). */
export default function WorkoutPlanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const personalization = usePersonalizationStatus(true);

  const [plan, setPlan] = useState<MyWorkoutPlanResponse>(null);
  const [today, setToday] = useState<MyTodayWorkoutPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const loadPlan = useCallback(async (signal?: AbortSignal) => {
    setErrorMessage(null);
    try {
      const [planResponse, todayResponse] = await Promise.all([
        getMyPlan(signal),
        getTodayPlan(signal).catch(() => null),
      ]);
      setPlan(planResponse ?? null);
      setToday(todayResponse);
    } catch (error) {
      if (signal?.aborted) return;
      if (error instanceof ApiError && error.isUnauthorized) {
        router.replace("/pages/login");
        return;
      }
      setErrorMessage(
        error instanceof ApiError ? error.message : "Antrenman programın yüklenemedi.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      loadPlan(controller.signal);
      return () => controller.abort();
    }, [loadPlan]),
  );

  // Program kayittan sonra arka planda hazirlaniyor; hazir oldugunda ekrani tazele.
  const { isPending } = personalization;
  const wasPendingRef = useRef(false);
  useEffect(() => {
    if (wasPendingRef.current && !isPending) loadPlan();
    wasPendingRef.current = isPending;
  }, [isPending, loadPlan]);

  const todayName = JS_DAY_TO_NAME[new Date().getDay()];

  const startDay = (day: MyPlanDay) => {
    // Plan gunu kimligi yalnizca bugunun antrenmani icin biliniyor (GET /api/my-plan/today);
    // baska bir gunun antrenmani serbest antrenman olarak baslar.
    const isServerToday = today?.day?.dayOfWeek === day.dayOfWeek && today.workoutPlanDayId;
    router.push({
      pathname: "/pages/workout/active/[id]",
      params: {
        id: String(day.workout.id),
        title: day.workout.title,
        workoutPlanDayId: isServerToday ? String(today?.workoutPlanDayId) : undefined,
      },
    } as never);
  };

  // Kardiyo bitirici ayri bir katalog antrenmanidir; plan gunune baglanmadan serbest antrenman olarak baslar.
  const startCardio = (workout: MyPlanWorkout) => {
    router.push({
      pathname: "/pages/workout/active/[id]",
      params: { id: String(workout.id), title: workout.title },
    } as never);
  };

  const days = plan
    ? [...plan.days].sort(
        (a, b) => WEEK_ORDER.indexOf(a.dayOfWeek) - WEEK_ORDER.indexOf(b.dayOfWeek),
      )
    : [];
  const planGoal = plan?.goal ? PLAN_GOAL_TO_GOAL[plan.goal] : undefined;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/pages/dashboard"))}
            hitSlop={12}
            style={[styles.backButton, { backgroundColor: colors.inputBackground }]}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Antrenman Programım</Text>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <DumbbellSpinner color={colors.primary} size="large" />
          </View>
        ) : errorMessage ? (
          <View style={styles.centered}>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>{errorMessage}</Text>
            <Pressable
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setIsLoading(true);
                loadPlan();
              }}
            >
              <Text style={styles.retryLabel}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : !plan ? (
          <View style={styles.centered}>
            {personalization.isPending ? (
              <>
                <DumbbellSpinner color={colors.primary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Programın hazırlanıyor</Text>
                <Text style={[styles.muted, { color: colors.textSecondary }]}>
                  Kayıtta verdiğin bilgilere göre kişisel programını oluşturuyoruz. Hazır olunca burada görünecek.
                </Text>
              </>
            ) : personalization.isFailed ? (
              <>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Programın oluşturulamadı</Text>
                <Text style={[styles.muted, { color: colors.textSecondary }]}>
                  {personalization.errorMessage ?? "Kişisel programın hazırlanırken bir sorun oluştu."}
                </Text>
                <Pressable
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                  onPress={personalization.refetch}
                >
                  <Text style={styles.retryLabel}>Tekrar kontrol et</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Henüz bir programın yok</Text>
                <Text style={[styles.muted, { color: colors.textSecondary }]}>
                  Kişisel antrenman programın oluşturulduğunda haftalık günlerin burada görünecek.
                </Text>
              </>
            )}
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
              <Text style={[styles.planMeta, { color: colors.textSecondary }]}>
                {[planGoal ? GOAL_LABELS[planGoal] : null, `Haftada ${days.length} gün`]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              {plan.summary ? (
                <Text style={[styles.planSummary, { color: colors.textSecondary }]}>{plan.summary}</Text>
              ) : null}
            </View>

            {WEEK_ORDER.map((dayName) => {
              const day = days.find((d) => d.dayOfWeek === dayName);
              const isToday = dayName === todayName;
              if (!day) {
                return (
                  <View
                    key={dayName}
                    style={[styles.restRow, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.restDay, { color: colors.textSecondary }]}>
                      {DAY_NAMES[dayName]}
                      {isToday ? " · Bugün" : ""}
                    </Text>
                    <Text style={[styles.restLabel, { color: colors.textSecondary }]}>Dinlenme</Text>
                  </View>
                );
              }

              const expanded = expandedDay === dayName || (expandedDay === null && isToday);
              return (
                <View
                  key={dayName}
                  style={[
                    styles.dayCard,
                    { backgroundColor: colors.card, borderColor: isToday ? colors.primary : colors.border },
                  ]}
                >
                  <Pressable
                    onPress={() => setExpandedDay(expanded ? "" : dayName)}
                    accessibilityRole="button"
                    accessibilityLabel={`${DAY_NAMES[dayName]}: ${day.workout.title}`}
                  >
                    <View style={styles.dayTop}>
                      <Text style={[styles.dayName, { color: isToday ? colors.primary : colors.textSecondary }]}>
                        {DAY_NAMES[dayName]}
                        {isToday ? " · Bugün" : ""}
                      </Text>
                      <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={colors.textSecondary}
                      />
                    </View>
                    <Text style={[styles.workoutTitle, { color: colors.text }]}>{day.workout.title}</Text>
                    <Text style={[styles.workoutMeta, { color: colors.textSecondary }]}>
                      {day.workout.durationMin} dk · {day.exercises.length} egzersiz
                      {day.cardioFinisher ? ` · + ${day.cardioFinisher.durationMin} dk kardiyo` : ""}
                    </Text>
                  </Pressable>

                  {expanded ? (
                    <View style={styles.exercises}>
                      {[...day.exercises]
                        .sort((a, b) => a.order - b.order)
                        .map((exercise) => (
                          <View key={`${exercise.exerciseId}-${exercise.order}`} style={styles.exerciseRow}>
                            <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
                              {exercise.name}
                            </Text>
                            <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>
                              {formatExercise(exercise)}
                            </Text>
                          </View>
                        ))}
                      <Pressable
                        style={[styles.startButton, { backgroundColor: colors.primary }]}
                        onPress={() => startDay(day)}
                        accessibilityRole="button"
                      >
                        <Text style={styles.startLabel}>Antrenmana Başla</Text>
                      </Pressable>
                      {day.cardioFinisher ? (
                        <View style={[styles.cardioCard, { borderColor: colors.border }]}>
                          <Text style={[styles.exerciseName, { color: colors.text }]}>
                            Kardiyo bitirici: {day.cardioFinisher.title}
                          </Text>
                          <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>
                            Ana antrenmandan sonra · {day.cardioFinisher.durationMin} dk
                          </Text>
                          <Pressable
                            style={[styles.cardioButton, { backgroundColor: colors.inputBackground }]}
                            onPress={() => startCardio(day.cardioFinisher!)}
                            accessibilityRole="button"
                          >
                            <Text style={[styles.cardioLabel, { color: colors.text }]}>Kardiyoyu Başlat</Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  muted: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  emptyTitle: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  retryButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  retryLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  summaryCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  planName: { fontSize: 16, fontWeight: "700" },
  planMeta: { fontSize: 12, marginTop: 4 },
  planSummary: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  dayCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
  dayTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dayName: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  workoutTitle: { fontSize: 16, fontWeight: "700", marginTop: 6 },
  workoutMeta: { fontSize: 12, marginTop: 2 },
  exercises: { marginTop: 12, gap: 8 },
  exerciseRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  exerciseName: { flex: 1, fontSize: 13, fontWeight: "600" },
  exerciseMeta: { fontSize: 12 },
  startButton: { marginTop: 8, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  startLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  cardioCard: { marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 4 },
  cardioButton: { marginTop: 6, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardioLabel: { fontSize: 13, fontWeight: "700" },
  restRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  restDay: { fontSize: 13, fontWeight: "600" },
  restLabel: { fontSize: 12 },
});
