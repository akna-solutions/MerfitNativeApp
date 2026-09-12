import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PremiumFeature } from "../../../shared/plus/components/PremiumFeature";
import { ApiError } from "../../../services/api/client";
import { getDashboard } from "../../../services/api/dashboard";
import { DashboardResponse } from "../../../services/api/types";
import { AiWorkoutCard } from "./components/AiWorkoutCard";
import { DashboardHeader } from "./components/DashboardHeader";
import { EmptyState } from "./components/EmptyState";
import { GoalProgressCard } from "./components/GoalProgressCard";
import { ProgressCard } from "./components/ProgressCard";
import { QuickStats } from "./components/QuickStats";
import { RecommendedWorkouts } from "./components/RecommendedWorkouts";
import { WorkoutCard } from "./components/WorkoutCard";
import { colors } from "./theme";
import { DashboardData, WorkoutSummary } from "./types";

/** Backend'in CustomerDashboardResponse'unu (services/api/types.ts) ekranin bekledigi DashboardData sekline cevirir. */
function mapToDashboardData(response: DashboardResponse): DashboardData {
  const mapWorkout = (workout: DashboardResponse["todayWorkout"]): WorkoutSummary | null =>
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

export function DashboardScreen() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
    setErrorMessage(null);
    try {
      const response = await getDashboard(signal);
      setData(mapToDashboardData(response));
    } catch (error) {
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
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard]);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const workoutAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!data) return;
    Animated.stagger(110, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(workoutAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [data, headerAnim, progressAnim, workoutAnim, statsAnim]);

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

  const goToWorkout = (workout: WorkoutSummary) => {
    router.push({
      pathname: "/pages/workout/active/[id]",
      params: { id: workout.id, title: workout.title },
    } as never);
  };

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
        <Text style={styles.errorText}>
          {errorMessage ?? "Dashboard yüklenemedi."}
        </Text>
        <Pressable
          style={styles.retryButton}
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
            <DashboardHeader name={data.userName} />
          </Animated.View>

          {data.hasCompletedFirstWorkout && data.todayWorkout ? (
            <>
              <Animated.View style={[styles.padded, fadeUp(workoutAnim)]}>
                <WorkoutCard
                  workout={data.todayWorkout}
                  onPress={() =>
                    goToWorkout(data.todayWorkout as WorkoutSummary)
                  }
                />
              </Animated.View>

              <Animated.View style={[styles.padded, fadeUp(progressAnim)]}>
                <ProgressCard progress={data.todayProgress} />
              </Animated.View>

              <Animated.View style={[styles.padded, fadeUp(statsAnim)]}>
                <QuickStats stats={data.quickStats} />
                {data.goalProgress ? (
                  <GoalProgressCard goal={data.goalProgress} />
                ) : null}
              </Animated.View>

              <View style={[styles.padded, styles.gapTop]}>
                <PremiumFeature feature="AI_WORKOUT" borderRadius={18}>
                  <AiWorkoutCard />
                </PremiumFeature>
              </View>

              <RecommendedWorkouts
                workouts={data.recommended}
                onSelect={goToWorkout}
              />
            </>
          ) : (
            <Animated.View style={[styles.padded, fadeUp(workoutAnim)]}>
              <EmptyState
                onStartFirstWorkout={() =>
                  data.recommended[0] && goToWorkout(data.recommended[0])
                }
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
  gapTop: { marginTop: 28 },
});
