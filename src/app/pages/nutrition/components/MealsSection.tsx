import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
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

export function MealsSection({ meals, onAddMeal, onSelectMeal }: Props) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Bugünün Öğünleri</Text>

      {MEAL_TYPES.map((type, index) => {
        const entries = meals.filter((meal) => meal.type === type);
        return (
          <View
            key={type}
            style={[
              styles.group,
              index === MEAL_TYPES.length - 1 && styles.groupLast,
            ]}
          >
            <View style={styles.groupHeader}>
              <View style={styles.groupTitleRow}>
                <Ionicons
                  name={MEAL_ICONS[type]}
                  size={15}
                  color={colors.textMuted}
                />
                <Text style={styles.groupTitle}>{type}</Text>
              </View>
              <Pressable
                onPress={() => onAddMeal(type)}
                hitSlop={10}
                style={styles.addButton}
              >
                <Ionicons name="add" size={16} color={colors.electricBlue} />
              </Pressable>
            </View>

            {entries.length > 0 ? (
              <View style={styles.entries}>
                {entries.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onPress={() => onSelectMeal(meal)}
                  />
                ))}
              </View>
            ) : (
              <Pressable
                onPress={() => onAddMeal(type)}
                style={styles.emptyCard}
              >
                <Text style={styles.emptyLabel}>Henüz öğün eklenmedi</Text>
                <Text style={styles.emptyAction}>+ Öğün ekle</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  group: { marginBottom: 18 },
  groupLast: { marginBottom: 0 },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  groupTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  addButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  entries: { gap: 8 },
  emptyCard: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  emptyLabel: { color: colors.textMuted, fontSize: 12 },
  emptyAction: { color: colors.electricBlue, fontSize: 12, fontWeight: "700" },
});
