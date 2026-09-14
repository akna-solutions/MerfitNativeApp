import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { Category } from "../types";

const CATEGORIES: ("Tümü" | Category)[] = [
  "Tümü",
  "Kuvvet",
  "Kardiyo",
  "HIIT",
  "Hareketlilik",
  "Core",
  "Üst Vücut",
  "Alt Vücut",
];

type Props = {
  active: "Tümü" | Category;
  onChange: (category: "Tümü" | Category) => void;
};

export function WorkoutCategories({ active, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {CATEGORIES.map((category) => {
        const isActive = category === active;
        return (
          <Pressable
            key={category}
            onPress={() => onChange(category)}
            style={[
              styles.pill,
              { backgroundColor: colors.inputBackground },
              isActive && { backgroundColor: colors.primaryPressed },
            ]}
          >
            <Text style={[styles.label, { color: colors.textSecondary }, isActive && styles.labelActive]}>
              {category}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 8 },
  pill: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 12, fontWeight: "600" },
  labelActive: { color: "#FFFFFF" },
});
