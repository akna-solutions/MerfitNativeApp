import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

import { ApiError } from "../../../services/api/client";
import { getDailyNutrition, logWater } from "../../../services/api/nutrition";
import { NutritionResponse } from "../../../services/api/types";
import { useNutritionAssistant } from "../../../shared/nutritionAssistant/useNutritionAssistant";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { AddMealModal } from "./components/AddMealModal";
import { CalorieBreakdown } from "./components/CalorieBreakdown";
import { CalorieCard } from "./components/CalorieCard";
import { DateSelector } from "./components/DateSelector";
import { EditMealItemModal } from "./components/EditMealItemModal";
import { MacroOverview } from "./components/MacroOverview";
import { MealsSection } from "./components/MealsSection";
import { NutritionEmptyState } from "./components/NutritionEmptyState";
import { NutritionHeader } from "./components/NutritionHeader";
import { NutritionInsight } from "./components/NutritionInsight";
import { TodayNutritionPlanCard } from "./components/TodayNutritionPlanCard";
import { WaterTracker } from "./components/WaterTracker";
import { NutritionAssistantSheet } from "./components/assistant/NutritionAssistantSheet";
import { MealEntry, MealType, NutritionData } from "./types";

/** "yyyy-MM-dd" - backend'in DateOnly query param formati (yerel saat diliminde). */
function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Fotografla ogun kisayolunda ogun turu gunun saatine gore secilir. */
function mealTypeForNow(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return "Kahvaltı";
  if (hour < 16) return "Öğle Yemeği";
  if (hour < 21) return "Akşam Yemeği";
  return "Atıştırmalık";
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
    insight: response.insight,
  };
}

export function NutritionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState<NutritionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addMealType, setAddMealType] = useState<MealType | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [addMealStep, setAddMealStep] = useState<"search" | "photo">("search");
  const [isAddingWater, setIsAddingWater] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const assistant = useNutritionAssistant(toDateParam(selectedDate));
  const { action } = useLocalSearchParams<{ action?: string }>();

  const openAddMeal = useCallback((type: MealType) => {
    setAddMealStep("search");
    setAddMealType(type);
  }, []);

  // Dashboard'daki "Öğün Gir" kisayolu bu sekmeye action=photo ile gelir: bugunun gunlugunde Ogun Ekle
  // penceresi dogrudan fotograf adiminda acilir. Parametre tuketildikten sonra temizlenir ki sekmeye
  // tekrar donuldugunde pencere yeniden acilmasin.
  useEffect(() => {
    if (action !== "photo") return;
    router.setParams({ action: undefined } as never);
    setSelectedDate((prev) => (toDateParam(prev) === toDateParam(new Date()) ? prev : new Date()));
    setAddMealStep("photo");
    setAddMealType(mealTypeForNow());
  }, [action, router]);

  const loadNutrition = useCallback(
    async (date: Date, signal?: AbortSignal) => {
      setErrorMessage(null);
      try {
        const response = await getDailyNutrition(toDateParam(date), signal);
        if (signal?.aborted) return;
        setData(mapToNutritionData(response));
      } catch (error) {
        // Gun hizla degistirildiginde iptal edilen eski istek, yeni gunun durumunu ezmemeli.
        if (signal?.aborted) return;
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Beslenme verisi yüklenemedi. Lütfen tekrar deneyin.",
        );
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [],
  );

  const refreshNutritionSilently = useCallback(async (date: Date) => {
    try {
      const response = await getDailyNutrition(toDateParam(date));
      setData((prev) => (prev ? mapToNutritionData(response) : prev));
    } catch {
      // Ekrandaki veri korunur; bir sonraki acilista yeniden yuklenir.
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

  // Baslik ve tarih secici yalnizca ilk acilista animasyonla gelir; gun degisince yerinde kalir.
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  // Tarih secicinin altindaki icerik her yeni gun verisinde yeniden animasyonla gelir.
  useEffect(() => {
    if (!data) return;
    calorieCardAnim.setValue(0);
    macrosAnim.setValue(0);
    Animated.stagger(110, [
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
  }, [data, calorieCardAnim, macrosAnim]);

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
      const water = await logWater({
        amountMl: 250,
        date: toDateParam(selectedDate),
      });
      setData((prev) => (prev ? { ...prev, water } : prev));
    } catch {
      // Sessizce yut - kullanıcı butona tekrar basabilir.
    } finally {
      setIsAddingWater(false);
    }
  };

  const handleMealLogged = (entries: MealEntry[]) => {
    // Ayni kayit tekrar gelirse (orn. daha once onaylanmis fotograf analizi) listede iki kez gosterilmez.
    setData((prev) => {
      if (!prev) return prev;
      const ids = new Set(entries.map((e) => e.id));
      return {
        ...prev,
        meals: [...prev.meals.filter((m) => !ids.has(m.id)), ...entries],
      };
    });
    setAddMealType(null);
    // Makrolar ve degerlendirme kartinin guncel kalmasi icin gunun verisi arka planda yenilenir.
    void refreshNutritionSilently(selectedDate);
  };

  const handleMealUpdated = (entry: MealEntry) => {
    setData((prev) =>
      prev ? { ...prev, meals: prev.meals.map((m) => (m.id === entry.id ? entry : m)) } : prev,
    );
    setEditingMealId(null);
    void refreshNutritionSilently(selectedDate);
  };

  const handleMealDeleted = (id: string) => {
    setData((prev) => (prev ? { ...prev, meals: prev.meals.filter((m) => m.id !== id) } : prev));
    setEditingMealId(null);
    void refreshNutritionSilently(selectedDate);
  };

  const hasLoggedFirstMeal = (data?.meals.length ?? 0) > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.padded, fadeUp(headerAnim, -8)]}>
            <NutritionHeader
              onAssistantPress={() => setAssistantOpen(true)}
              onNotificationsPress={() =>
                router.push({
                  pathname: "/pages/notifications",
                  params: { category: "nutrition" },
                } as never)
              }
            />
          </Animated.View>

          <View style={styles.sectionGap}>
            <DateSelector date={selectedDate} onChangeDay={handleChangeDay} />
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            <TodayNutritionPlanCard />
          </View>

          {isLoading ? (
            <View style={[styles.padded, styles.sectionGap, styles.dayState]}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : errorMessage || !data ? (
            <View style={[styles.padded, styles.sectionGap, styles.dayState]}>
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                {errorMessage ?? "Beslenme verisi yüklenemedi."}
              </Text>
              <Pressable
                style={[
                  styles.retryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setIsLoading(true);
                  loadNutrition(selectedDate);
                }}
              >
                <Text style={styles.retryLabel}>Tekrar dene</Text>
              </Pressable>
            </View>
          ) : hasLoggedFirstMeal ? (
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
                <NutritionInsight
                  insight={data.insight}
                  onViewSuggestions={() => setAssistantOpen(true)}
                />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <MealsSection
                  meals={data.meals}
                  onAddMeal={openAddMeal}
                  onSelectMeal={(meal) => setEditingMealId(meal.id)}
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
                onAddFirstMeal={() => openAddMeal("Kahvaltı")}
              />
              <View style={styles.sectionGap}>
                <NutritionInsight
                  insight={data.insight}
                  onViewSuggestions={() => setAssistantOpen(true)}
                />
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>

      <AddMealModal
        visible={addMealType !== null}
        mealType={addMealType}
        initialStep={addMealStep}
        selectedDate={selectedDate}
        onLogged={handleMealLogged}
        onClose={() => setAddMealType(null)}
      />

      <EditMealItemModal
        mealId={editingMealId}
        onUpdated={handleMealUpdated}
        onDeleted={handleMealDeleted}
        onClose={() => setEditingMealId(null)}
      />

      <NutritionAssistantSheet
        visible={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        controller={assistant}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  dayState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    minHeight: 240,
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
  sectionGap: { marginTop: 24 },
});
