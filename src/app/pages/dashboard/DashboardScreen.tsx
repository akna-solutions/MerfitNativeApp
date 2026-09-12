import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PremiumFeature } from "../../../shared/plus/components/PremiumFeature";
import { AiWorkoutCard } from "./components/AiWorkoutCard";
import { DashboardHeader } from "./components/DashboardHeader";
import { EmptyState } from "./components/EmptyState";
import { GoalProgressCard } from "./components/GoalProgressCard";
import { ProgressCard } from "./components/ProgressCard";
import { QuickStats } from "./components/QuickStats";
import { RecommendedWorkouts } from "./components/RecommendedWorkouts";
import { WorkoutCard } from "./components/WorkoutCard";
import { MOCK_DASHBOARD_DATA } from "./mockData";
import { colors } from "./theme";
import { WorkoutSummary } from "./types";

export function DashboardScreen() {
  const router = useRouter();

  // TODO: gerçek API bağlandığında MOCK_DASHBOARD_DATA yerine fetch/query
  // sonucu (aynı DashboardData şekli) kullanılacak.
  const data = MOCK_DASHBOARD_DATA;

  const headerAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const workoutAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [headerAnim, progressAnim, workoutAnim, statsAnim]);

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
                <GoalProgressCard goal={data.goalProgress} />
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
  scrollContent: { paddingTop: 16, paddingBottom: 156 },
  padded: { paddingHorizontal: 24 },
  gapTop: { marginTop: 28 },
});
