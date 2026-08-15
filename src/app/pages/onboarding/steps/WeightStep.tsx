import { View } from "react-native";

import { OnboardingInput } from "../components/OnboardingInput";
import { UnitToggle } from "../components/UnitToggle";
import { WeightUnit } from "../types";

const UNIT_OPTIONS: [
  { label: string; value: "kg" },
  { label: string; value: "lb" },
] = [
  { label: "kg", value: "kg" },
  { label: "lb", value: "lb" },
];

type Props = {
  unit: WeightUnit;
  onUnitChange: (unit: WeightUnit) => void;
  value: string;
  onChange: (value: string) => void;
};

export function WeightStep({ unit, onUnitChange, value, onChange }: Props) {
  return (
    <View>
      <UnitToggle options={UNIT_OPTIONS} value={unit} onChange={onUnitChange} />
      <OnboardingInput
        value={value}
        onChangeText={(text) =>
          onChange(text.replace(/[^0-9.]/g, "").slice(0, 5))
        }
        placeholder={unit === "kg" ? "78" : "172"}
        keyboardType="decimal-pad"
        autoFocus
      />
    </View>
  );
}
