import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { TimeRange } from "../types";

const OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "Hafta", value: "week" },
  { label: "Ay", value: "month" },
  { label: "3 Ay", value: "3months" },
  { label: "Yıl", value: "year" },
];

type Props = {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
};

export function TimeRangeSelector({ value, onChange }: Props) {
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
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#171A20",
  },
  pillActive: { backgroundColor: colors.buttonElectricBlue },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  labelActive: { color: "#FFFFFF" },
});
