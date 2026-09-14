import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { MealEntry } from "../types";

type Props = {
  meal: MealEntry;
  onPress: () => void;
};

export function MealCard({ meal, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {meal.name}
      </Text>
      <View style={styles.right}>
        <Text style={[styles.calories, { color: colors.textSecondary }]}>{meal.calories} kcal</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  name: { fontSize: 13, fontWeight: "600", flex: 1 },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
  calories: { fontSize: 12, fontWeight: "600" },
});
