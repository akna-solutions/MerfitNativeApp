import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Option<T extends string> = { label: string; value: T };

type Props<T extends string> = {
  options: readonly [Option<T>, Option<T>];
  value: T;
  onChange: (value: T) => void;
};

export function UnitToggle<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
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
  row: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pill: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
  pillActive: { backgroundColor: colors.buttonElectricBlue },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  labelActive: { color: colors.textPrimary },
});
