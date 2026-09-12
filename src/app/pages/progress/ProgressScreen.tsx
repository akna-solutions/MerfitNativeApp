import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PremiumFeature } from "../../../shared/plus/components/PremiumFeature";
import { ApiError } from "../../../services/api/client";
import { getProgress } from "../../../services/api/progress";
import { ProgressResponse } from "../../../services/api/types";
import { BodyMetrics } from "./components/BodyMetrics";
import { CurrentWeightCard } from "./components/CurrentWeightCard";
import { GoalProgress } from "./components/GoalProgress";
import { MotivationalCard } from "./components/MotivationalCard";
import { OverviewStats } from "./components/OverviewStats";
import { PerformanceTrends } from "./components/PerformanceTrends";
import { PersonalInsights } from "./components/PersonalInsights";
import { ProgressEmptyState } from "./components/ProgressEmptyState";
import { ProgressHeader } from "./components/ProgressHeader";
import { RecentActivity } from "./components/RecentActivity";
import { ScoreCard } from "./components/ScoreCard";
import { TimeRangeSelector } from "./components/TimeRangeSelector";
import { WeeklyActivity } from "./components/WeeklyActivity";
import { WeightChart } from "./components/WeightChart";
import { colors } from "./theme";
import { ProgressData, TimeRange } from "./types";

function mapToProgressData(response: ProgressResponse): ProgressData {
  return {
    hasCompletedFirstWorkout: response.hasCompletedFirstWorkout,
    goalType: response.goalType,
    goalLabel: response.goalLabel,
    goalPercent: response.goalPercent ?? undefined,
    workoutsCompleted: response.workoutsCompleted ?? undefined,
    workoutsGoal: response.workoutsGoal ?? undefined,
    currentWeight: response.currentWeight,
    startingWeight: response.startingWeight,
    targetWeight: response.targetWeight,
    monthlyChange: response.monthlyChange,
    workouts: response.workouts,
    calories: response.calories,
    streak: response.streak,
    trainingMinutes: response.trainingMinutes,
    weeklyWorkouts: response.weeklyWorkouts,
    weightHistory: response.weightHistory,
    bodyMetrics: response.bodyMetrics,
    recentActivity: response.recentActivity.map((item) => ({
      id: String(item.id),
      title: item.title,
      durationMin: item.durationMin,
      dateLabel: item.dateLabel,
    })),
  };
}

export function ProgressScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>("3months");

  const [data, setData] = useState<ProgressData | null>(null);
  const [score, setScore] = useState<ProgressResponse["score"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProgress = useCallback(async (range: TimeRange, signal?: AbortSignal) => {
    setErrorMessage(null);
    try {
      const response = await getProgress(range, signal);
      setData(mapToProgressData(response));
      setScore(response.score);
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        router.replace("/pages/login");
        return;
      }
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "İlerleme verisi yüklenemedi. Lütfen tekrar deneyin.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    setIsLoading(true);
    const controller = new AbortController();
    loadProgress(timeRange, controller.signal);
    return () => controller.abort();
  }, [timeRange, loadProgress]);

  const chartData = useMemo(() => data?.weightHistory ?? [], [data]);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const weightCardAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!data) return;
    Animated.stagger(110, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(weightCardAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [data, headerAnim, weightCardAnim, statsAnim, chartAnim]);

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

  if (isLoading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.electricBlue} size="large" />
      </View>
    );
  }

  if (errorMessage || !data) {
    return (
      <View style={[styles.root, styles.centered]}>
        <StatusBar style="light" />
        <Text style={styles.errorText}>{errorMessage ?? "İlerleme verisi yüklenemedi."}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setIsLoading(true);
            loadProgress(timeRange);
          }}
        >
          <Text style={styles.retryLabel}>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.padded, fadeUp(headerAnim, -8)]}>
            <ProgressHeader onSettingsPress={() => {}} />
          </Animated.View>

          {data.hasCompletedFirstWorkout ? (
            <>
              {score ? (
                <Animated.View
                  style={[
                    styles.padded,
                    styles.sectionGap,
                    fadeUp(weightCardAnim),
                  ]}
                >
                  <ScoreCard
                    points={score.points}
                    weeklyChange={score.weeklyChange}
                    rank={score.rank ?? 0}
                    onPress={() => router.push("/pages/leaderboard")}
                  />
                </Animated.View>
              ) : null}

              <Animated.View
                style={[
                  styles.padded,
                  styles.sectionGap,
                  fadeUp(weightCardAnim),
                ]}
              >
                <CurrentWeightCard
                  currentWeight={data.currentWeight}
                  monthlyChange={data.monthlyChange}
                />
              </Animated.View>

              <Animated.View
                style={[styles.padded, styles.sectionGap, fadeUp(statsAnim)]}
              >
                <OverviewStats
                  workouts={data.workouts}
                  calories={data.calories}
                  streak={data.streak}
                  trainingMinutes={data.trainingMinutes}
                />
              </Animated.View>

              <Animated.View
                style={[styles.padded, styles.sectionGap, fadeUp(chartAnim)]}
              >
                <View style={styles.selectorGap}>
                  <TimeRangeSelector
                    value={timeRange}
                    onChange={setTimeRange}
                  />
                </View>
                <WeightChart data={chartData} />
              </Animated.View>

              <View style={[styles.padded, styles.sectionGap]}>
                <GoalProgress
                  goalType={data.goalType}
                  goalLabel={data.goalLabel}
                  goalPercent={data.goalPercent}
                  workoutsCompleted={data.workoutsCompleted}
                  workoutsGoal={data.workoutsGoal}
                  currentWeight={data.currentWeight}
                  targetWeight={data.targetWeight}
                />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <PremiumFeature feature="ADVANCED_ANALYTICS">
                  <PerformanceTrends />
                </PremiumFeature>
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <PremiumFeature feature="PERSONAL_INSIGHTS">
                  <PersonalInsights />
                </PremiumFeature>
              </View>

              {data.bodyMetrics.length > 0 ? (
                <View style={[styles.padded, styles.sectionGap]}>
                  <BodyMetrics
                    metrics={data.bodyMetrics}
                    onViewAll={() => {
                      // TODO: tüm body metrics ekranı eklendiğinde yönlendir.
                    }}
                  />
                </View>
              ) : null}

              <View style={[styles.padded, styles.sectionGap]}>
                <WeeklyActivity days={data.weeklyWorkouts} />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <RecentActivity items={data.recentActivity} />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <MotivationalCard workoutsThisMonth={data.workouts} />
              </View>
            </>
          ) : (
            <Animated.View
              style={[styles.padded, styles.sectionGap, fadeUp(weightCardAnim)]}
            >
              <ProgressEmptyState
                onStartWorkout={() => router.push("/pages/workouts")}
              />
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  errorText: { color: colors.textMuted, fontSize: 14, textAlign: "center" },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.electricBlue,
  },
  retryLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  scrollContent: { paddingTop: 16, paddingBottom: 156 },
  padded: { paddingHorizontal: 24 },
  sectionGap: { marginTop: 28 },
  selectorGap: { marginBottom: 16 },
});
