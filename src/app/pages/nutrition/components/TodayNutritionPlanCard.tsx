import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { getTodayNutritionPlan } from "../../../../services/api/myNutritionPlan";
import { MyNutritionPlanDay } from "../../../../services/api/types";
import { colors } from "../theme";

/**
 * "Bugünün Beslenme Planı" bolumu - NutritionPlanGenerator tarafindan onceden uretilip
 * kaydedilmis PLANLANAN ogunleri gosterir (GET /api/my-nutrition-plan/today). Bu, ekranin geri
 * kalaninda gosterilen GERCEKTE tuketilen ogun loglarindan (Meal/MealItem, useDailyNutrition)
 * tamamen bagimsizdir - iki kavram bilinçli olarak ayri tutulur (bkz. backend Faz 2 raporu).
 */
export function TodayNutritionPlanCard() {
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
      <View style={[styles.card, styles.centered]}>
        <ActivityIndicator color={colors.electricBlue} size="small" />
      </View>
    );
  }

  // Aktif plan yoksa (kisisellestirme henuz tamamlanmadiysa) veya bugun icin ogun yoksa
  // karti hic gosterme - ekranin geri kalani (gunluk loglama) normal calismaya devam eder.
  if (!hasActivePlan || !day || day.meals.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Bugünün Beslenme Planı</Text>
      {day.meals.map((meal) => (
        <View key={meal.mealType} style={styles.mealRow}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealName}>{meal.name}</Text>
            <Text style={styles.mealCalories}>{meal.totalCalories} kcal</Text>
          </View>
          <Text style={styles.mealItems} numberOfLines={1}>
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
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  centered: { alignItems: "center", justifyContent: "center", minHeight: 80 },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: "700", marginBottom: 12 },
  mealRow: { marginTop: 10 },
  mealHeader: { flexDirection: "row", justifyContent: "space-between" },
  mealName: { color: colors.textPrimary, fontSize: 14, fontWeight: "600" },
  mealCalories: { color: colors.electricBlue, fontSize: 13, fontWeight: "700" },
  mealItems: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
