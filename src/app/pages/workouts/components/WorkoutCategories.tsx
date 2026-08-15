import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { colors } from "../theme";
import { Category } from "../types";

const CATEGORIES: ("All" | Category)[] = [
  "All",
  "Strength",
  "Cardio",
  "HIIT",
  "Mobility",
  "Core",
  "Upper Body",
  "Lower Body",
];

type Props = {
  active: "All" | Category;
  onChange: (category: "All" | Category) => void;
};

export function WorkoutCategories({ active, onChange }: Props) {
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
            style={[styles.pill, isActive && styles.pillActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
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
    backgroundColor: "#171A20",
  },
  pillActive: { backgroundColor: colors.buttonElectricBlue },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  labelActive: { color: "#FFFFFF" },
});
