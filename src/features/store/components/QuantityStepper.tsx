import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";

type Props = {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  /** Azaltma butonu min'de de basilabilir olsun (sepette 1 iken kaldirmak icin). */
  allowRemove?: boolean;
  testID?: string;
  label?: string;
};

export function QuantityStepper({ value, min = 1, max, onChange, allowRemove = false, testID, label = "Adet" }: Props) {
  const { colors } = useTheme();
  const canDecrease = allowRemove || value > min;
  const canIncrease = value < max;
  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
      <Pressable
        testID={testID ? `${testID}-minus` : undefined}
        onPress={() => onChange(value - 1)}
        disabled={!canDecrease}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`${label} azalt`}
        accessibilityState={{ disabled: !canDecrease }}
        style={styles.button}
      >
        <Ionicons name={allowRemove && value <= min ? "trash-outline" : "remove"} size={16} color={canDecrease ? colors.text : colors.icon} />
      </Pressable>
      <Text testID={testID ? `${testID}-value` : undefined} style={[styles.value, { color: colors.text }]} accessibilityLabel={`${label} ${value}`}>
        {value}
      </Text>
      <Pressable
        testID={testID ? `${testID}-plus` : undefined}
        onPress={() => onChange(value + 1)}
        disabled={!canIncrease}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`${label} artır`}
        accessibilityState={{ disabled: !canIncrease }}
        style={styles.button}
      >
        <Ionicons name="add" size={16} color={canIncrease ? colors.text : colors.icon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, height: 36 },
  button: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  value: { minWidth: 24, textAlign: "center", fontSize: 14, fontWeight: "700" },
});
