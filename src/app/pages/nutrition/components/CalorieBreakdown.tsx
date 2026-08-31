import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { MEAL_TYPES, MealEntry } from "../types";

type Props = { meals: MealEntry[] };

export function CalorieBreakdown({ meals }: Props) {
  const totals = MEAL_TYPES.map((type) => ({
    type,
    calories: meals
      .filter((meal) => meal.type === type)
      .reduce((sum, meal) => sum + meal.calories, 0),
  }));
  const total = totals.reduce((sum, item) => sum + item.calories, 0);

  return (
    <View>
      <Text style={styles.sectionTitle}>Kalori Dağılımı</Text>

      <View style={styles.card}>
        {totals.map((item) => (
          <View key={item.type} style={styles.row}>
            <Text style={styles.label}>{item.type}</Text>
            <Text style={styles.value}>{item.calories}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.totalLabel}>Toplam</Text>
          <Text style={styles.totalValue}>{total}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  label: { color: colors.textMuted, fontSize: 13 },
  value: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  totalLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  totalValue: { color: colors.electricBlue, fontSize: 13, fontWeight: "700" },
});
