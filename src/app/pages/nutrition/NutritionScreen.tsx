import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PremiumFeature } from "../../../shared/plus/components/PremiumFeature";
import { ApiError } from "../../../services/api/client";
import { getDailyNutrition, logWater } from "../../../services/api/nutrition";
import { NutritionResponse } from "../../../services/api/types";
import { AddMealModal } from "./components/AddMealModal";
import { AiNutritionPlanCard } from "./components/AiNutritionPlanCard";
import { CalorieBreakdown } from "./components/CalorieBreakdown";
import { CalorieCard } from "./components/CalorieCard";
import { DateSelector } from "./components/DateSelector";
import { MacroOverview } from "./components/MacroOverview";
import { MealsSection } from "./components/MealsSection";
import { NutritionEmptyState } from "./components/NutritionEmptyState";
import { NutritionHeader } from "./components/NutritionHeader";
import { NutritionInsight } from "./components/NutritionInsight";
import { TodayNutritionPlanCard } from "./components/TodayNutritionPlanCard";
import { WaterTracker } from "./components/WaterTracker";
import { colors } from "./theme";
import { MealEntry, MealType, NutritionData } from "./types";

/** "yyyy-MM-dd" - backend'in DateOnly query param formati (yerel saat diliminde). */
function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mapToNutritionData(response: NutritionResponse): NutritionData {
  return {
    hasLoggedFirstMeal: response.hasLoggedFirstMeal,
    dailyCalories: response.dailyCalories,
    macros: response.macros,
    water: response.water,
    meals: response.meals.map((meal) => ({
      id: String(meal.id),
      type: meal.type,
      name: meal.name,
      calories: meal.calories,
    })),
  };
}

export function NutritionScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState<NutritionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addMealType, setAddMealType] = useState<MealType | null>(null);
  const [isAddingWater, setIsAddingWater] = useState(false);

  const loadNutrition = useCallback(async (date: Date, signal?: AbortSignal) => {
    setErrorMessage(null);
    try {
      const response = await getDailyNutrition(toDateParam(date), signal);
      setData(mapToNutritionData(response));
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Beslenme verisi yüklenemedi. Lütfen tekrar deneyin.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const controller = new AbortController();
    loadNutrition(selectedDate, controller.signal);
    return () => controller.abort();
  }, [selectedDate, loadNutrition]);

  const consumedCalories = useMemo(
    () => data?.meals.reduce((sum, meal) => sum + meal.calories, 0) ?? 0,
    [data],
  );

  const headerAnim = useRef(new Animated.Value(0)).current;
  const calorieCardAnim = useRef(new Animated.Value(0)).current;
  const macrosAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!data) return;
    Animated.stagger(110, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(calorieCardAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(macrosAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [data, headerAnim, calorieCardAnim, macrosAnim]);

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

  const handleChangeDay = (direction: -1 | 1) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + direction);
      return next;
    });
  };

  const handleAddWater = async () => {
    if (!data || isAddingWater) return;
    setIsAddingWater(true);
    try {
      const water = await logWater({ amountMl: 250, date: toDateParam(selectedDate) });
      setData((prev) => (prev ? { ...prev, water } : prev));
    } catch {
      // Sessizce yut - kullanıcı butona tekrar basabilir.
    } finally {
      setIsAddingWater(false);
    }
  };

  const handleMealLogged = (entry: MealEntry) => {
    setData((prev) => (prev ? { ...prev, meals: [...prev.meals, entry] } : prev));
    setAddMealType(null);
  };

  const hasLoggedFirstMeal = (data?.meals.length ?? 0) > 0;

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
        <Text style={styles.errorText}>{errorMessage ?? "Beslenme verisi yüklenemedi."}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setIsLoading(true);
            loadNutrition(selectedDate);
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
            <NutritionHeader onNotificationsPress={() => {}} />
          </Animated.View>

          <View style={styles.sectionGap}>
            <DateSelector date={selectedDate} onChangeDay={handleChangeDay} />
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            <TodayNutritionPlanCard />
          </View>

          {hasLoggedFirstMeal ? (
            <>
              <Animated.View
                style={[
                  styles.padded,
                  styles.sectionGap,
                  fadeUp(calorieCardAnim),
                ]}
              >
                <CalorieCard
                  consumedCalories={consumedCalories}
                  dailyCalories={data.dailyCalories}
                />
              </Animated.View>

              <Animated.View
                style={[styles.padded, styles.sectionGap, fadeUp(macrosAnim)]}
              >
                <MacroOverview macros={data.macros} />
              </Animated.View>

              <View style={[styles.padded, styles.sectionGap]}>
                <PremiumFeature feature="AI_NUTRITION" borderRadius={18}>
                  <AiNutritionPlanCard />
                </PremiumFeature>
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <MealsSection
                  meals={data.meals}
                  onAddMeal={setAddMealType}
                  onSelectMeal={() => {
                    // TODO: meal detay ekranı eklendiğinde buradan yönlendir.
                  }}
                />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <WaterTracker
                  consumedL={data.water.consumedL}
                  targetL={data.water.targetL}
                  onAdd={handleAddWater}
                />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <CalorieBreakdown meals={data.meals} />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <NutritionInsight
                  onViewSuggestions={() => {
                    // TODO: Nutrition Suggestions ekranı eklendiğinde yönlendir.
                  }}
                />
              </View>
            </>
          ) : (
            <Animated.View
              style={[
                styles.padded,
                styles.sectionGap,
                fadeUp(calorieCardAnim),
              ]}
            >
              <NutritionEmptyState
                onAddFirstMeal={() => setAddMealType("Kahvaltı")}
              />
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>

      <AddMealModal
        visible={addMealType !== null}
        mealType={addMealType}
        selectedDate={selectedDate}
        onLogged={handleMealLogged}
        onClose={() => setAddMealType(null)}
      />
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
  sectionGap: { marginTop: 24 },
});
