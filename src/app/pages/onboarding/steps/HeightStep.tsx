import { StyleSheet, Text, View } from "react-native";

import { OnboardingInput } from "../components/OnboardingInput";
import { UnitToggle } from "../components/UnitToggle";
import { colors } from "../theme";
import { HeightUnit } from "../types";

const UNIT_OPTIONS: [
  { label: string; value: "cm" },
  { label: string; value: "ft_in" },
] = [
  { label: "cm", value: "cm" },
  { label: "ft / in", value: "ft_in" },
];

type Props = {
  unit: HeightUnit;
  onUnitChange: (unit: HeightUnit) => void;
  cmValue: string;
  onCmChange: (value: string) => void;
  feetValue: string;
  onFeetChange: (value: string) => void;
  inchesValue: string;
  onInchesChange: (value: string) => void;
};

export function HeightStep({
  unit,
  onUnitChange,
  cmValue,
  onCmChange,
  feetValue,
  onFeetChange,
  inchesValue,
  onInchesChange,
}: Props) {
  const numeric = (text: string) => text.replace(/[^0-9]/g, "").slice(0, 3);

  return (
    <View>
      <UnitToggle options={UNIT_OPTIONS} value={unit} onChange={onUnitChange} />

      {unit === "cm" ? (
        <OnboardingInput
          value={cmValue}
          onChangeText={(text) => onCmChange(numeric(text))}
          placeholder="180"
          keyboardType="number-pad"
          maxLength={3}
          autoFocus
        />
      ) : (
        <View style={styles.row}>
          <View style={styles.half}>
            <OnboardingInput
              value={feetValue}
              onChangeText={(text) => onFeetChange(numeric(text))}
              placeholder="5"
              keyboardType="number-pad"
              maxLength={1}
              autoFocus
            />
            <Text style={styles.unitLabel}>ft</Text>
          </View>
          <View style={styles.half}>
            <OnboardingInput
              value={inchesValue}
              onChangeText={(text) => onInchesChange(numeric(text))}
              placeholder="10"
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.unitLabel}>in</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  unitLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    marginLeft: 4,
  },
});
