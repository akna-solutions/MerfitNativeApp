import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PremiumFeature } from "../../../shared/plus/components/PremiumFeature";
import { ApiError } from "../../../services/api/client";
import { WorkoutListItem } from "../../../services/api/types";
import { getWorkouts } from "../../../services/api/workouts";
import { AiWorkoutPlanCard } from "./components/AiWorkoutPlanCard";
import { FeaturedWorkout } from "./components/FeaturedWorkout";
import { WorkoutCategories } from "./components/WorkoutCategories";
import { WorkoutEmptyState } from "./components/WorkoutEmptyState";
import { WorkoutFilterModal } from "./components/WorkoutFilterModal";
import { WorkoutGrid } from "./components/WorkoutGrid";
import { WorkoutHeader } from "./components/WorkoutHeader";
import { WorkoutSearch } from "./components/WorkoutSearch";
import { WorkoutSkeleton } from "./components/WorkoutSkeleton";
import { colors } from "./theme";
import {
    Category,
    EMPTY_FILTERS,
    hasActiveFilters,
    Workout,
    WorkoutFilters,
} from "./types";

/** Backend'in WorkoutListItem'ini (services/api/types.ts) ekranin bekledigi Workout sekline cevirir. */
function mapApiWorkout(item: WorkoutListItem): Workout {
  return {
    id: String(item.id),
    title: item.title,
    tagline: item.tagline ?? undefined,
    duration: item.durationMin,
    difficulty: item.difficulty as Workout["difficulty"],
    category: item.category,
    muscleGroup: item.muscleGroup ?? "",
    equipment: item.equipment,
    imageUrl: item.imageUrl ?? "",
    featured: item.featured,
  };
}

export function WorkoutsScreen() {
  const router = useRouter();
  const searchRef = useRef<TextInput>(null);

  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);
  const [personalized, setPersonalized] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"Tümü" | Category>("Tümü");
  const [filters, setFilters] = useState<WorkoutFilters>(EMPTY_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const loadWorkouts = useCallback(async () => {
    setErrorMessage(null);
    try {
      const [catalog, recommended] = await Promise.all([
        // Katalog kucuk oldugu icin (mevcut UI zaten hepsini client-side filtreliyor)
        // tek sayfada mumkun oldugunca genis (max 100) cekiyoruz.
        getWorkouts({ pageSize: 100 }),
        getWorkouts({ personalized: true, pageSize: 6 }),
      ]);
      setAllWorkouts(catalog.items.map(mapApiWorkout));
      setPersonalized(recommended.items.map(mapApiWorkout));
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        router.replace("/pages/login");
        return;
      }
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Antrenmanlar yüklenemedi. Lütfen tekrar deneyin.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const featured = useMemo(
    () => allWorkouts.find((workout) => workout.featured) ?? allWorkouts[0],
    [allWorkouts],
  );

  const filteredWorkouts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allWorkouts.filter((workout) => {
      if (activeCategory !== "Tümü" && workout.category !== activeCategory) {
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
  }, [allWorkouts, searchQuery, activeCategory, filters]);

  const showEmptyState = !loading && !errorMessage && filteredWorkouts.length === 0;

  const goToWorkoutDetail = (workout: Workout) => {
    router.push({
      pathname: "/pages/workout/active/[id]",
      params: { id: workout.id, title: workout.title },
    } as never);
  };

  const clearAllFilters = () => {
    setFilters(EMPTY_FILTERS);
    setActiveCategory("Tümü");
    setSearchQuery("");
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
            ) : errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <Text
                  style={styles.retryLabel}
                  onPress={() => {
                    setLoading(true);
                    loadWorkouts();
                  }}
                >
                  Tekrar dene
                </Text>
              </View>
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
                      title="Sana özel öneriler"
                      workouts={personalized}
                      onSelect={goToWorkoutDetail}
                    />
                  </View>
                ) : null}

                <View style={styles.sectionGap}>
                  <WorkoutGrid
                    title="Tüm Antrenmanlar"
                    workouts={filteredWorkouts}
                    onSelect={goToWorkoutDetail}
                  />
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

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
  scrollContent: { paddingTop: 16, paddingBottom: 156 },
  padded: { paddingHorizontal: 24 },
  searchGap: { marginTop: 20 },
  categoriesGap: { marginTop: 18 },
  sectionGap: { marginTop: 28 },
  errorBox: { alignItems: "center", gap: 12, paddingVertical: 40 },
  errorText: { color: colors.textMuted, fontSize: 13, textAlign: "center" },
  retryLabel: { color: colors.electricBlue, fontSize: 13, fontWeight: "700" },
});
