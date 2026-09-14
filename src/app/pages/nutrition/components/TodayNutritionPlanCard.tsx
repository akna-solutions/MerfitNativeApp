import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { getTodayNutritionPlan } from "../../../../services/api/myNutritionPlan";
import { MyNutritionPlanDay } from "../../../../services/api/types";
import { useTheme } from "../../../../shared/theme/ThemeContext";

/**
 * "Bugünün Beslenme Planı" bolumu - NutritionPlanGenerator tarafindan onceden uretilip
 * kaydedilmis PLANLANAN ogunleri gosterir (GET /api/my-nutrition-plan/today). Bu, ekranin geri
 * kalaninda gosterilen GERCEKTE tuketilen ogun loglarindan (Meal/MealItem, useDailyNutrition)
 * tamamen bagimsizdir - iki kavram bilinçli olarak ayri tutulur (bkz. backend Faz 2 raporu).
 */
export function TodayNutritionPlanCard() {
  const { colors } = useTheme();
  const [day, setDay] = useState<MyNutritionPlanDay | null>(null);
  const [hasActivePlan, setHasActivePlan] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    getTodayNutritionPlan(controller.signal)
      .then((response) => {
        if (!isMounted) return;
        setDay(response.day);
        setHasActivePlan(response.hasActivePlan);
      })
      .catch(() => {
        // Plan henuz hazir olmayabilir - sessizce yut, kart hic gosterilmez.
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.card, styles.centered, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  }

  // Aktif plan yoksa (kisisellestirme henuz tamamlanmadiysa) veya bugun icin ogun yoksa
  // karti hic gosterme - ekranin geri kalani (gunluk loglama) normal calismaya devam eder.
  if (!hasActivePlan || !day || day.meals.length === 0) {
    return null;
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Bugünün Beslenme Planı</Text>
      {day.meals.map((meal) => (
        <View key={meal.mealType} style={styles.mealRow}>
          <View style={styles.mealHeader}>
            <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
            <Text style={[styles.mealCalories, { color: colors.primary }]}>{meal.totalCalories} kcal</Text>
          </View>
          <Text style={[styles.mealItems, { color: colors.textSecondary }]} numberOfLines={1}>
            {meal.items.map((item) => item.foodName).join(", ")}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  centered: { alignItems: "center", justifyContent: "center", minHeight: 80 },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  mealRow: { marginTop: 10 },
  mealHeader: { flexDirection: "row", justifyContent: "space-between" },
  mealName: { fontSize: 14, fontWeight: "600" },
  mealCalories: { fontSize: 13, fontWeight: "700" },
  mealItems: { fontSize: 12, marginTop: 2 },
});
