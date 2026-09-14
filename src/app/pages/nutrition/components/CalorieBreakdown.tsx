import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { MEAL_TYPES, MealEntry } from "../types";

type Props = { meals: MealEntry[] };

export function CalorieBreakdown({ meals }: Props) {
  const { colors } = useTheme();
  const totals = MEAL_TYPES.map((type) => ({
    type,
    calories: meals
      .filter((meal) => meal.type === type)
      .reduce((sum, meal) => sum + meal.calories, 0),
  }));
  const total = totals.reduce((sum, item) => sum + item.calories, 0);

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Kalori Dağılımı</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {totals.map((item) => (
          <View key={item.type} style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{item.type}</Text>
            <Text style={[styles.value, { color: colors.text }]}>{item.calories}</Text>
          </View>
        ))}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.row}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Toplam</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>{total}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  label: { fontSize: 13 },
  value: { fontSize: 13, fontWeight: "600" },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  totalLabel: { fontSize: 13, fontWeight: "700" },
  totalValue: { fontSize: 13, fontWeight: "700" },
});
