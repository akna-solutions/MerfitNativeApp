import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    BottomNavigation,
    NavTab,
} from "../dashboard/components/BottomNavigation";
import { CURRENT_USER_ENTRY, MOCK_CURRENT_USER } from "../leaderboard/mockData";
import { BodyMetrics } from "./components/BodyMetrics";
import { CurrentWeightCard } from "./components/CurrentWeightCard";
import { GoalProgress } from "./components/GoalProgress";
import { MotivationalCard } from "./components/MotivationalCard";
import { OverviewStats } from "./components/OverviewStats";
import { ProgressEmptyState } from "./components/ProgressEmptyState";
import { ProgressHeader } from "./components/ProgressHeader";
import { RecentActivity } from "./components/RecentActivity";
import { ScoreCard } from "./components/ScoreCard";
import { TimeRangeSelector } from "./components/TimeRangeSelector";
import { WeeklyActivity } from "./components/WeeklyActivity";
import { WeightChart } from "./components/WeightChart";
import { getWeightHistoryForRange, MOCK_PROGRESS_DATA } from "./mockData";
import { colors } from "./theme";
import { TimeRange } from "./types";

export function ProgressScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>("3months");

  // TODO: gerçek API bağlandığında MOCK_PROGRESS_DATA yerine fetch/query
  // sonucu (aynı ProgressData şekli) kullanılacak.
  const data = MOCK_PROGRESS_DATA;

  const chartData = useMemo(
    () => getWeightHistoryForRange(data.weightHistory, timeRange),
    [data.weightHistory, timeRange],
  );

  const headerAnim = useRef(new Animated.Value(0)).current;
  const weightCardAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [headerAnim, weightCardAnim, statsAnim, chartAnim]);

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

  const handleTabChange = (tab: NavTab) => {
    if (tab === "progress") return;
    if (tab === "home") {
      router.push("/pages/dashboard");
      return;
    }
    // TODO: /pages/nutrition, /pages/profile eklendiğinde bu yönlendirmeler
    // gerçek sayfalara gidecek.
    router.push(`/pages/${tab}` as never);
  };

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
              <Animated.View
                style={[
                  styles.padded,
                  styles.sectionGap,
                  fadeUp(weightCardAnim),
                ]}
              >
                <ScoreCard
                  points={MOCK_CURRENT_USER.points}
                  weeklyChange={MOCK_CURRENT_USER.weeklyChange}
                  rank={CURRENT_USER_ENTRY.rank}
                  onPress={() => router.push("/pages/leaderboard")}
                />
              </Animated.View>

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
                <BodyMetrics
                  metrics={data.bodyMetrics}
                  onViewAll={() => {
                    // TODO: tüm body metrics ekranı eklendiğinde yönlendir.
                  }}
                />
              </View>

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

      <BottomNavigation active="progress" onChange={handleTabChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 140 },
  padded: { paddingHorizontal: 24 },
  sectionGap: { marginTop: 28 },
  selectorGap: { marginBottom: 16 },
});
