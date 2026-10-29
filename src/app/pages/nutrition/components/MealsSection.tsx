import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { MEAL_TYPES, MealEntry, MealType } from "../types";
import { MealCard } from "./MealCard";

const MEAL_ICONS: Record<MealType, keyof typeof Ionicons.glyphMap> = {
  "Kahvaltı": "sunny-outline",
  "Öğle Yemeği": "restaurant-outline",
  "Akşam Yemeği": "moon-outline",
  "Atıştırmalık": "fast-food-outline",
};

type Props = {
  meals: MealEntry[];
  onAddMeal: (type: MealType) => void;
  onSelectMeal: (meal: MealEntry) => void;
};

/** Ogun turleri acilip kapanan kartlardir; kapaliyken toplam kalori ve kayit sayisi gorunur. */
export function MealsSection({ meals, onAddMeal, onSelectMeal }: Props) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState<Partial<Record<MealType, boolean>>>({});

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Bugünün Öğünleri</Text>

      {MEAL_TYPES.map((type) => {
        const entries = meals.filter((meal) => meal.type === type);
        const totalCalories = entries.reduce((sum, meal) => sum + meal.calories, 0);
        const isOpen = expanded[type] === true;
        return (
          <View
            key={type}
            testID={`meal-group-${type}`}
            style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Pressable
              testID={`meal-group-toggle-${type}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              onPress={() => setExpanded((current) => ({ ...current, [type]: !current[type] }))}
              style={styles.groupHeader}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.inputBackground }]}>
                <Ionicons name={MEAL_ICONS[type]} size={20} color={colors.primary} />
              </View>
              <View style={styles.groupText}>
                <Text style={[styles.groupTitle, { color: colors.text }]}>{type}</Text>
                <Text style={[styles.groupMeta, { color: colors.textSecondary }]}>
                  {entries.length > 0
                    ? `${entries.length} kayıt · ${totalCalories.toLocaleString()} kcal`
                    : "Henüz öğün eklenmedi"}
                </Text>
              </View>
              <Ionicons
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>

            {isOpen ? (
              <View style={styles.body}>
                {entries.map((meal) => (
                  <MealCard key={meal.id} meal={meal} onPress={() => onSelectMeal(meal)} />
                ))}
                <Pressable
                  onPress={() => onAddMeal(type)}
                  style={[styles.addRow, { borderColor: colors.border }]}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={[styles.addLabel, { color: colors.primary }]}>Öğün ekle</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 14,
  },
  group: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    minHeight: 72,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  groupText: { flex: 1 },
  groupTitle: { fontSize: 16, fontWeight: "700" },
  groupMeta: { fontSize: 12, fontWeight: "600", marginTop: 3 },
  body: { gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  addRow: {
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
  },
  addLabel: { fontSize: 13, fontWeight: "700" },
});
