import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { PeriodFilter as PeriodFilterType } from "../types";

const OPTIONS: { label: string; value: PeriodFilterType }[] = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "allTime" },
];

type Props = {
  value: PeriodFilterType;
  onChange: (value: PeriodFilterType) => void;
};

export function PeriodFilter({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
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
    backgroundColor: "#171A20",
  },
  pillActive: { backgroundColor: colors.buttonElectricBlue },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  labelActive: { color: "#FFFFFF" },
});
