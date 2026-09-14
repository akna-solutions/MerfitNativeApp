import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { PeriodFilter as PeriodFilterType } from "../types";

const OPTIONS: { label: string; value: PeriodFilterType }[] = [
  { label: "Bu Hafta", value: "week" },
  { label: "Bu Ay", value: "month" },
  { label: "Tüm Zamanlar", value: "allTime" },
];

type Props = {
  value: PeriodFilterType;
  onChange: (value: PeriodFilterType) => void;
};

export function PeriodFilter({ value, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.pill,
              { backgroundColor: colors.inputBackground },
              active && { backgroundColor: colors.primaryPressed },
            ]}
          >
            <Text style={[styles.label, { color: colors.textSecondary }, active && styles.labelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  pill: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 11, fontWeight: "600" },
  labelActive: { color: "#FFFFFF" },
});
