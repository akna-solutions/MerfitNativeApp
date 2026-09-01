import { View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";
import { Goal } from "../types";

const OPTIONS: { label: string; value: Goal }[] = [
  { label: "Kilo vermek", value: "lose_weight" },
  { label: "Kas yapmak", value: "build_muscle" },
  { label: "Daha güçlü olmak", value: "get_stronger" },
  { label: "Fitness seviyesini artırmak", value: "improve_fitness" },
  { label: "Kilomu korumak", value: "maintain_weight" },
  { label: "Dayanıklılığı artırmak", value: "improve_endurance" },
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
