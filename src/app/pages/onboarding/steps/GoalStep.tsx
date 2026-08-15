import { View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";
import { Goal } from "../types";

const OPTIONS: { label: string; value: Goal }[] = [
  { label: "Lose weight", value: "lose_weight" },
  { label: "Build muscle", value: "build_muscle" },
  { label: "Get stronger", value: "get_stronger" },
  { label: "Improve fitness", value: "improve_fitness" },
  { label: "Maintain my weight", value: "maintain_weight" },
  { label: "Improve endurance", value: "improve_endurance" },
];

type Props = {
  value: Goal | null;
  onChange: (value: Goal) => void;
};

export function GoalStep({ value, onChange }: Props) {
  return (
    <View>
      {OPTIONS.map((option) => (
        <OnboardingOption
          key={option.value}
          label={option.label}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}
