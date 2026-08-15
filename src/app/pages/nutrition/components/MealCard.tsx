import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { MealEntry } from "../types";

type Props = {
  meal: MealEntry;
  onPress: () => void;
};

export function MealCard({ meal, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Text style={styles.name} numberOfLines={1}>
        {meal.name}
      </Text>
      <View style={styles.right}>
        <Text style={styles.calories}>{meal.calories} kcal</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  name: { color: colors.textPrimary, fontSize: 13, fontWeight: "600", flex: 1 },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
  calories: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
});
