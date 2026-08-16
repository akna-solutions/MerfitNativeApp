import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PremiumFeature } from "../../../shared/plus/components/PremiumFeature";
import {
    BottomNavigation,
    NavTab,
} from "../dashboard/components/BottomNavigation";
import { AiWorkoutPlanCard } from "./components/AiWorkoutPlanCard";
import { FeaturedWorkout } from "./components/FeaturedWorkout";
import { WorkoutCategories } from "./components/WorkoutCategories";
import { WorkoutEmptyState } from "./components/WorkoutEmptyState";
import { WorkoutFilterModal } from "./components/WorkoutFilterModal";
import { WorkoutGrid } from "./components/WorkoutGrid";
import { WorkoutHeader } from "./components/WorkoutHeader";
import { WorkoutSearch } from "./components/WorkoutSearch";
import { WorkoutSkeleton } from "./components/WorkoutSkeleton";
import { getPersonalizedWorkouts, MOCK_WORKOUTS } from "./mockData";
import { colors } from "./theme";
import {
    Category,
    EMPTY_FILTERS,
    hasActiveFilters,
    Workout,
    WorkoutFilters,
} from "./types";

export function WorkoutsScreen() {
  const router = useRouter();
  const searchRef = useRef<TextInput>(null);

  // TODO: Backend/API bağlandığında MOCK_WORKOUTS yerine fetch/query sonucu
  // (aynı Workout[] şekli) kullanılacak.
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"All" | Category>("All");
  const [filters, setFilters] = useState<WorkoutFilters>(EMPTY_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, []);

  const featured = useMemo(
    () => MOCK_WORKOUTS.find((workout) => workout.featured) ?? MOCK_WORKOUTS[0],
    [],
  );

  const personalized = useMemo(
    () => getPersonalizedWorkouts(MOCK_WORKOUTS),
    [],
  );

  const filteredWorkouts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return MOCK_WORKOUTS.filter((workout) => {
      if (activeCategory !== "All" && workout.category !== activeCategory) {
        return false;
      }
      if (query && !workout.title.toLowerCase().includes(query)) {
        return false;
      }
      if (
        filters.difficulty.length > 0 &&
        !filters.difficulty.includes(workout.difficulty)
      ) {
        return false;
      }
      if (
        filters.muscleGroup.length > 0 &&
        !filters.muscleGroup.includes(workout.muscleGroup)
      ) {
        return false;
      }
      if (
        filters.equipment.length > 0 &&
        !workout.equipment.some((item) => filters.equipment.includes(item))
      ) {
        return false;
      }
      if (filters.duration.length > 0) {
        const matchesDuration = filters.duration.some((range) => {
          if (range === "under20") return workout.duration < 20;
          if (range === "20to40")
            return workout.duration >= 20 && workout.duration <= 40;
          return workout.duration > 40;
        });
        if (!matchesDuration) return false;
      }
      return true;
    });
  }, [searchQuery, activeCategory, filters]);

  const showEmptyState = !loading && filteredWorkouts.length === 0;

  const goToWorkoutDetail = (workout: Workout) => {
    router.push({
      pathname: "/pages/workout/active/[id]",
      params: { id: workout.id, title: workout.title },
    } as never);
  };

  const clearAllFilters = () => {
    setFilters(EMPTY_FILTERS);
    setActiveCategory("All");
    setSearchQuery("");
  };

  const handleTabChange = (tab: NavTab) => {
    if (tab === "workouts") return;
    // TODO: /pages/progress, /pages/nutrition, /pages/profile eklendiğinde
    // bu yönlendirmeler gerçek sayfalara gidecek.
    router.push(
      tab === "home" ? "/pages/dashboard" : (`/pages/${tab}` as never),
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.padded}>
            <WorkoutHeader
              onSearchPress={() => searchRef.current?.focus()}
              onFilterPress={() => setFilterModalVisible(true)}
              filtersActive={hasActiveFilters(filters)}
            />

            <View style={styles.searchGap}>
              <WorkoutSearch
                ref={searchRef}
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </View>
          </View>

          <View style={styles.categoriesGap}>
            <View style={styles.padded}>
              <WorkoutCategories
                active={activeCategory}
                onChange={setActiveCategory}
              />
            </View>
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            {loading ? (
              <WorkoutSkeleton />
            ) : showEmptyState ? (
              <WorkoutEmptyState onClearFilters={clearAllFilters} />
            ) : (
              <>
                {featured ? (
                  <FeaturedWorkout
                    workout={featured}
                    onPress={() => goToWorkoutDetail(featured)}
                  />
                ) : null}

                <View style={styles.sectionGap}>
                  <PremiumFeature feature="AI_WORKOUT" borderRadius={18}>
                    <AiWorkoutPlanCard />
                  </PremiumFeature>
                </View>

                {personalized.length > 0 ? (
                  <View style={styles.sectionGap}>
                    <WorkoutGrid
                      title="Recommended for you"
                      workouts={personalized}
                      onSelect={goToWorkoutDetail}
                    />
                  </View>
                ) : null}

                <View style={styles.sectionGap}>
                  <WorkoutGrid
                    title="All Workouts"
                    workouts={filteredWorkouts}
                    onSelect={goToWorkoutDetail}
                  />
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomNavigation active="workouts" onChange={handleTabChange} />

      <WorkoutFilterModal
        visible={filterModalVisible}
        filters={filters}
        onApply={(next) => {
          setFilters(next);
          setFilterModalVisible(false);
        }}
        onClose={() => setFilterModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 140 },
  padded: { paddingHorizontal: 24 },
  searchGap: { marginTop: 20 },
  categoriesGap: { marginTop: 18 },
  sectionGap: { marginTop: 28 },
});
