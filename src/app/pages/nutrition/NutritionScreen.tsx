import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PremiumFeature } from "../../../shared/plus/components/PremiumFeature";
import {
    BottomNavigation,
    NavTab,
} from "../dashboard/components/BottomNavigation";
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
import { WaterTracker } from "./components/WaterTracker";
import { MOCK_NUTRITION_DATA } from "./mockData";
import { colors } from "./theme";
import { FoodItem, MealEntry, MealType } from "./types";

export function NutritionScreen() {
  const router = useRouter();

  // TODO: Backend/API bağlandığında MOCK_NUTRITION_DATA yerine fetch/query
  // sonucu (aynı NutritionData şekli) kullanılacak. Su ve öğün ekleme gibi
  // interaction'lar şimdilik yalnızca local state'i güncelliyor.
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meals, setMeals] = useState<MealEntry[]>(MOCK_NUTRITION_DATA.meals);
  const [waterConsumedL, setWaterConsumedL] = useState(
    MOCK_NUTRITION_DATA.water.consumedL,
  );
  const [addMealType, setAddMealType] = useState<MealType | null>(null);

  const consumedCalories = useMemo(
    () => meals.reduce((sum, meal) => sum + meal.calories, 0),
    [meals],
  );

  const headerAnim = useRef(new Animated.Value(0)).current;
  const calorieCardAnim = useRef(new Animated.Value(0)).current;
  const macrosAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [headerAnim, calorieCardAnim, macrosAnim]);

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
    // TODO: gün değiştiğinde ilgili tarihe ait gerçek veri backend'den
    // çekilecek. Şimdilik mock veri sabit kalıyor.
  };

  const handleAddWater = () => {
    setWaterConsumedL((prev) =>
      Math.min(MOCK_NUTRITION_DATA.water.targetL, +(prev + 0.25).toFixed(2)),
    );
  };

  const handleSelectFood = (food: FoodItem) => {
    if (!addMealType) return;
    setMeals((prev) => [
      ...prev,
      {
        id: `${food.id}-${Date.now()}`,
        type: addMealType,
        name: food.name,
        calories: food.calories,
      },
    ]);
    setAddMealType(null);
  };

  const handleTabChange = (tab: NavTab) => {
    if (tab === "nutrition") return;
    if (tab === "home") {
      router.push("/pages/dashboard");
      return;
    }
    // TODO: /pages/profile eklendiğinde bu yönlendirme gerçek sayfaya gidecek.
    router.push(`/pages/${tab}` as never);
  };

  const hasLoggedFirstMeal = meals.length > 0;

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
                  dailyCalories={MOCK_NUTRITION_DATA.dailyCalories}
                />
              </Animated.View>

              <Animated.View
                style={[styles.padded, styles.sectionGap, fadeUp(macrosAnim)]}
              >
                <MacroOverview macros={MOCK_NUTRITION_DATA.macros} />
              </Animated.View>

              <View style={[styles.padded, styles.sectionGap]}>
                <PremiumFeature feature="AI_NUTRITION" borderRadius={18}>
                  <AiNutritionPlanCard />
                </PremiumFeature>
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <MealsSection
                  meals={meals}
                  onAddMeal={setAddMealType}
                  onSelectMeal={() => {
                    // TODO: meal detay ekranı eklendiğinde buradan yönlendir.
                  }}
                />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <WaterTracker
                  consumedL={waterConsumedL}
                  targetL={MOCK_NUTRITION_DATA.water.targetL}
                  onAdd={handleAddWater}
                />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <CalorieBreakdown meals={meals} />
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
                onAddFirstMeal={() => setAddMealType("Breakfast")}
              />
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>

      <BottomNavigation active="nutrition" onChange={handleTabChange} />

      <AddMealModal
        visible={addMealType !== null}
        mealType={addMealType}
        onSelectFood={handleSelectFood}
        onClose={() => setAddMealType(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 156 },
  padded: { paddingHorizontal: 24 },
  sectionGap: { marginTop: 24 },
});
