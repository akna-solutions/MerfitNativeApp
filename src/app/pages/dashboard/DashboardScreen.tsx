import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DumbbellSpinner } from "../../../shared/motion/DumbbellSpinner";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCampaigns } from "../../../services/api/campaigns";
import { ApiError } from "../../../services/api/client";
import { getDashboard } from "../../../services/api/dashboard";
import { getLeaderboard } from "../../../services/api/leaderboard";
import { getTodayPlan } from "../../../services/api/myPlan";
import { getUnreadNotificationCount } from "../../../services/api/notifications";
import {
  ActivityCalendarResponse,
  CalendarDay,
  CampaignListItem,
  DashboardResponse,
  MyTodayWorkoutPlanResponse,
} from "../../../services/api/types";
import { AchievementCelebration } from "../../../shared/achievements/AchievementCelebration";
import { useAchievementCelebration } from "../../../shared/achievements/useAchievementCelebration";
import { fetchCalendar, peekCalendar } from "../../../shared/calendar/calendarCache";
import { toDateKey, weekKeys as buildWeekKeys } from "../../../shared/calendar/dates";
import { useNavigationGuard } from "../../../shared/navigation/useNavigationGuard";
import { usePersonalizationStatus } from "../../../shared/personalization/usePersonalizationStatus";
import { useWeightReminder } from "../../../shared/weightReminder/useWeightReminder";
import { WeightReminderModal } from "../../../shared/weightReminder/WeightReminderModal";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { CalorieRingCard } from "./components/CalorieRingCard";
import { CampaignsSection } from "./components/CampaignsSection";
import { DashboardHeader } from "./components/DashboardHeader";
import { GoalProgressCard } from "./components/GoalProgressCard";
import { PersonalizationPendingState } from "./components/PersonalizationPendingState";
import { QuickStats, QuickStatAction } from "./components/QuickStats";
import { RestDayCard } from "./components/RestDayCard";
import { TodayStartCard } from "./components/TodayStartCard";
import { usableImageUrls } from "./components/useImageCycle";
import { WeeklyActivitySection } from "./components/WeeklyActivitySection";
import { CalendarSheet } from "../progress/calendar/CalendarSheet";
import { DashboardData, WorkoutSummary } from "./types";

/** Backend'in CustomerDashboardResponse'unu (services/api/types.ts) ekranin bekledigi DashboardData sekline cevirir. */
function mapToDashboardData(response: DashboardResponse): DashboardData {
  const mapWorkout = (
    workout: DashboardResponse["todayWorkout"],
  ): WorkoutSummary | null =>
    workout
      ? {
          id: String(workout.id),
          title: workout.title,
          duration: workout.duration,
          meta: workout.meta,
          difficulty: workout.difficulty,
          imageUrl: workout.imageUrl ?? "",
        }
      : null;

  return {
    userName: response.userName,
    hasCompletedFirstWorkout: response.hasCompletedFirstWorkout,
    todayProgress: response.todayProgress,
    todayWorkout: mapWorkout(response.todayWorkout),
    quickStats: response.quickStats,
    goalProgress: response.goalProgress,
    recommended: response.recommended
      .map(mapWorkout)
      .filter((w): w is WorkoutSummary => w !== null),
  };
}

type LoadState<T> = { data: T; loading: boolean; error: boolean };

export function DashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const guard = useNavigationGuard();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [todayPlan, setTodayPlan] = useState<MyTodayWorkoutPlanResponse | null>(
    null,
  );
  const [unreadCount, setUnreadCount] = useState(0);
  // MB FIT puani karti, puan sayfasiyla ayni (aylik) donemden gelir.
  const [monthlyPoints, setMonthlyPoints] = useState<number | null>(null);

  // Haftalik aktivite ve bugunun kalori halkasi ayni takvim isteginden (bu hafta, Pzt-Paz) beslenir.
  const weekKeys = useMemo(() => buildWeekKeys(new Date()), []);
  const [week, setWeek] = useState<LoadState<ActivityCalendarResponse | null>>(() => {
    const cached = peekCalendar(weekKeys[0], weekKeys[6]);
    return { data: cached ?? null, loading: !cached, error: false };
  });
  const [campaigns, setCampaigns] = useState<LoadState<CampaignListItem[]>>({ data: [], loading: true, error: false });

  const personalization = usePersonalizationStatus(true);
  const previousPersonalizationStatus = useRef(personalization.status);

  const celebration = useAchievementCelebration();
  // Kilo hatirlaticisi rozet kutlamasi acikken beklemeye alinir; ikisi ust uste acilmaz.
  const weightReminder = useWeightReminder({ blocked: celebration.current !== null });

  const loadDashboard = useCallback(
    async (signal?: AbortSignal) => {
      setErrorMessage(null);
      try {
        const response = await getDashboard(signal);
        setData(mapToDashboardData(response));
      } catch (error) {
        // Ekrandan ayrilinca (blur) iptal edilen istek bir hata degildir.
        if (signal?.aborted) return;
        if (error instanceof ApiError && error.isUnauthorized) {
          router.replace("/pages/login");
          return;
        }
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Dashboard yüklenemedi. Lütfen tekrar deneyin.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const loadMonthlyPoints = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await getLeaderboard("month", signal);
      setMonthlyPoints(response.currentUser.points);
    } catch {
      // Puan alinamazsa kart "—" gosterir; dokununca puan sayfasi yine acilir.
    }
  }, []);

  const loadTodayPlan = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await getTodayPlan(signal);
      setTodayPlan(response);
    } catch {
      // Kisisel plan henuz hazir olmayabilir (orn. PersonalizationJob Pending) - sessizce yut,
      // dashboard genel oneriler ile calismaya devam eder.
    }
  }, []);

  const loadWeek = useCallback(
    async (signal?: AbortSignal) => {
      setWeek((previous) => ({ ...previous, loading: true, error: false }));
      try {
        // Odaga her geliste guncel veri: antrenman/ogun kaydi baska ekranda yapilmis olabilir.
        const response = await fetchCalendar(weekKeys[0], weekKeys[6], { force: true, signal });
        setWeek({ data: response, loading: false, error: false });
      } catch {
        if (signal?.aborted) return;
        setWeek((previous) => ({ ...previous, loading: false, error: true }));
      }
    },
    [weekKeys],
  );

  const loadCampaigns = useCallback(async (signal?: AbortSignal) => {
    setCampaigns((previous) => ({ ...previous, loading: true, error: false }));
    try {
      const response = await getCampaigns(signal);
      setCampaigns({ data: response, loading: false, error: false });
    } catch {
      if (signal?.aborted) return;
      setCampaigns((previous) => ({ ...previous, loading: false, error: true }));
    }
  }, []);

  // Sekme ekranlari antrenmandan donuste yeniden mount edilmez; bu yuzden veriyi yalnizca ilk
  // acilista degil, ekran her odaga geldiginde yeniden cekiyoruz. Aksi halde ilk antrenman
  // bittikten sonra da "İlk Antrenmana Başla" gorunmeye devam ediyordu.
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      loadDashboard(controller.signal);
      loadTodayPlan(controller.signal);
      loadMonthlyPoints(controller.signal);
      loadWeek(controller.signal);
      loadCampaigns(controller.signal);
      getUnreadNotificationCount(undefined, controller.signal)
        .then(setUnreadCount)
        .catch(() => {
          // Sayi alinamazsa zil noktasiz gosterilir.
        });
      return () => controller.abort();
    }, [loadDashboard, loadTodayPlan, loadMonthlyPoints, loadWeek, loadCampaigns]),
  );

  // PersonalizationJob Pending/Processing -> Completed'e gectiginde, artik gercek kisisel
  // plan hazir demektir: dashboard'u ve bugunun planini yeniden cek.
  useEffect(() => {
    const wasPending =
      previousPersonalizationStatus.current === "Pending" ||
      previousPersonalizationStatus.current === "Processing";
    const isNowCompleted = personalization.status === "Completed";

    if (wasPending && isNowCompleted) {
      loadDashboard();
      loadTodayPlan();
    }

    previousPersonalizationStatus.current = personalization.status;
  }, [personalization.status, loadDashboard, loadTodayPlan]);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const todayAnim = useRef(new Animated.Value(0)).current;
  const weekAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!data) return;
    Animated.stagger(
      110,
      [headerAnim, todayAnim, weekAnim, statsAnim].map((anim) =>
        Animated.timing(anim, { toValue: 1, duration: 420, useNativeDriver: true }),
      ),
    ).start();
  }, [data, headerAnim, todayAnim, weekAnim, statsAnim]);

  const fadeUp = (anim: Animated.Value, distance = 14) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  });

  const weekDays = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    week.data?.days.forEach((day) => map.set(day.date, day));
    return map;
  }, [week.data]);
  const todayKey = week.data?.today ?? toDateKey(new Date());
  const todayCalendar = weekDays.get(todayKey);

  const goToWorkout = (workout: WorkoutSummary) => {
    router.push({
      pathname: "/pages/workout/active/[id]",
      params: { id: workout.id, title: workout.title },
    } as never);
  };

  // Aktif program var ama bugun antrenman gunu degil: dinlenme gunu.
  const isRestDay = todayPlan?.hasActivePlan === true && !todayPlan.hasWorkoutToday;
  const personalDay = todayPlan?.hasWorkoutToday ? todayPlan.day : null;

  const goToWorkoutPlan = () => {
    router.push("/pages/workout/plan" as never);
  };

  const handleGameReward = () => {
    void loadDashboard();
    void loadMonthlyPoints();
  };

  // Ilk antrenman icin backend'in "bugunun antrenmani" onerisini kullan (recommended[0] aslinda
  // ikinci oneridir); hicbiri yoksa kullaniciyi antrenman katalogu sekmesine yonlendir.
  const startFirstWorkout = () => {
    const first = data?.todayWorkout ?? data?.recommended[0];
    if (first) {
      goToWorkout(first);
    } else {
      router.push("/pages/workouts");
    }
  };

  const goToPersonalWorkout = () => {
    if (!todayPlan?.day) return;
    router.push({
      pathname: "/pages/workout/active/[id]",
      params: {
        id: String(todayPlan.day.workout.id),
        title: todayPlan.day.workout.title,
        workoutPlanDayId: todayPlan.workoutPlanDayId
          ? String(todayPlan.workoutPlanDayId)
          : undefined,
      },
    } as never);
  };

  // Haftalik aktivitede bir gune dokununca takvim perdesi ana sayfanin ustunde acilir; Ilerleme'ye gecilmez.
  const [calendar, setCalendar] = useState<{ open: boolean; focusDate: string | null }>({ open: false, focusDate: null });
  const goToDay = (dateKey: string) => setCalendar({ open: true, focusDate: dateKey });

  if (isLoading) {
    return (
      <View
        style={[
          styles.root,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <DumbbellSpinner color={colors.primary} size="large" />
      </View>
    );
  }

  if (errorMessage || !data) {
    return (
      <View
        style={[
          styles.root,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {errorMessage ?? "Dashboard yüklenemedi."}
        </Text>
        <Pressable
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setIsLoading(true);
            loadDashboard();
          }}
        >
          <Text style={styles.retryLabel}>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }

  // Sol kart: kisisel planda bugun antrenman varsa o; dinlenme gunuyse dinlenme karti; plan yoksa genel oneri.
  const renderStartCard = () => {
    if (personalDay) {
      const completed = todayPlan?.isCompletedToday ?? false;
      return (
        <TodayStartCard
          testID="today-start-card"
          images={usableImageUrls([...personalDay.exercises.map((ex) => ex.imageUrl), personalDay.workout.imageUrl])}
          badge="BUGÜN"
          title={personalDay.workout.title}
          meta={`${personalDay.workout.durationMin} dk · ${personalDay.exercises.length} egzersiz`}
          ctaLabel={completed ? "Tekrar Başla" : "Antrenmana Başla"}
          completed={completed}
          onPress={guard(goToPersonalWorkout)}
        />
      );
    }
    if (isRestDay) {
      return <RestDayCard onRewardGranted={handleGameReward} />;
    }
    const suggestion = data.todayWorkout;
    if (data.hasCompletedFirstWorkout && suggestion) {
      return (
        <TodayStartCard
          testID="today-start-card"
          images={usableImageUrls([suggestion.imageUrl])}
          badge="ÖNERİLEN"
          title={suggestion.title}
          meta={`${suggestion.duration} · ${suggestion.meta}`}
          ctaLabel="Antrenmana Başla"
          onPress={guard(() => goToWorkout(suggestion))}
        />
      );
    }
    if (!data.hasCompletedFirstWorkout) {
      const first = data.todayWorkout ?? data.recommended[0];
      return (
        <TodayStartCard
          testID="today-start-card"
          images={usableImageUrls([first?.imageUrl])}
          badge="İLK ADIM"
          title={first?.title ?? "Yolculuğun burada başlıyor"}
          meta={first ? `${first.duration} · ${first.meta}` : "İlerlemeni görmek için ilk antrenmanını tamamla."}
          ctaLabel="İlk Antrenmana Başla"
          onPress={guard(startFirstWorkout)}
        />
      );
    }
    // Bugun zaten antrenman yapildi (backend todayWorkout'u null doner) ve kisisel plan yok.
    return (
      <TodayStartCard
        testID="today-start-card"
        images={[]}
        badge="BUGÜN"
        title="Bugünkü antrenman tamamlandı"
        meta="Yeni bir antrenman seçmek için kataloğa göz at."
        ctaLabel="Antrenmanlar"
        completed
        onPress={guard(() => router.navigate("/pages/workouts" as never))}
      />
    );
  };

  const statActions: QuickStatAction[] = [
    {
      id: "mbfit-points",
      label: "MB FIT Puanı (bu ay)",
      value: monthlyPoints === null ? "—" : monthlyPoints.toLocaleString("tr-TR"),
      icon: "trophy-outline",
      onPress: guard(() => router.push("/pages/leaderboard" as never)),
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.padded, fadeUp(headerAnim, -8)]}>
            <DashboardHeader
              name={data.userName}
              unreadCount={unreadCount}
              onProgressPress={guard(() => router.navigate("/pages/progress" as never))}
              onNotificationsPress={guard(() => router.push("/pages/notifications" as never))}
              onProfilePress={guard(() => router.navigate("/pages/profile" as never))}
            />
          </Animated.View>

          <Animated.View style={[styles.padded, styles.gapTop, fadeUp(weekAnim)]}>
            <WeeklyActivitySection
              weekKeys={weekKeys}
              days={weekDays}
              loading={week.loading}
              error={week.error}
              onRetry={() => void loadWeek()}
              onDayPress={guard(goToDay)}
            />
          </Animated.View>

          {personalization.isPending || personalization.isFailed ? (
            <Animated.View style={[styles.padded, styles.gapTop, fadeUp(todayAnim)]}>
              <PersonalizationPendingState
                isTimedOut={personalization.isTimedOut}
                isFailed={personalization.isFailed}
                errorMessage={personalization.errorMessage}
                onRetry={personalization.refetch}
              />
            </Animated.View>
          ) : null}

          <Animated.View style={[styles.padded, styles.todayRow, fadeUp(todayAnim)]}>
            {renderStartCard()}
            <CalorieRingCard
              today={todayCalendar}
              dailyTarget={week.data?.dailyCalorieTarget ?? null}
              loading={week.loading && !week.data}
              error={week.error && !week.data}
              onPress={guard(() => router.navigate("/pages/nutrition" as never))}
            />
          </Animated.View>

          {todayPlan?.hasActivePlan ? (
            <View style={[styles.padded, styles.planLinkGap]}>
              <Pressable
                onPress={guard(goToWorkoutPlan)}
                style={[
                  styles.planLink,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.planLinkTitle, { color: colors.text }]}>
                  Antrenman Programım
                </Text>
                <Text style={[styles.planLinkMeta, { color: colors.primary }]}>
                  Haftayı gör
                </Text>
              </Pressable>
            </View>
          ) : null}

          <Animated.View style={fadeUp(statsAnim)}>
            {data.hasCompletedFirstWorkout ? (
              <>
                <QuickStats stats={data.quickStats} actions={statActions} />
                {data.goalProgress ? (
                  <View style={styles.padded}>
                    <GoalProgressCard goal={data.goalProgress} />
                  </View>
                ) : null}
              </>
            ) : (
              <QuickStats stats={[]} actions={statActions} />
            )}

            <CampaignsSection
              campaigns={campaigns.data}
              loading={campaigns.loading}
              error={campaigns.error}
              onRetry={() => void loadCampaigns()}
              onSelect={guard((campaign: CampaignListItem) =>
                router.push({ pathname: "/pages/campaigns/[id]", params: { id: String(campaign.id) } } as never),
              )}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <AchievementCelebration achievement={celebration.current} onClose={celebration.dismiss} />

      <WeightReminderModal controller={weightReminder} />

      <CalendarSheet
        visible={calendar.open}
        focusDate={calendar.focusDate}
        onClose={() => setCalendar((current) => ({ ...current, open: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: { fontSize: 14, textAlign: "center" },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  scrollContent: { paddingTop: 16, paddingBottom: 156 },
  padded: { paddingHorizontal: 24 },
  gapTop: { marginTop: 28 },
  todayRow: { marginTop: 24, flexDirection: "row", gap: 12 },
  planLinkGap: { marginTop: 14 },
  planLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  planLinkTitle: { fontSize: 14, fontWeight: "700" },
  planLinkMeta: { fontSize: 13, fontWeight: "700" },
});
