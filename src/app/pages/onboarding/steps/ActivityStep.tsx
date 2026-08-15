import { View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";
import { ActivityLevel } from "../types";

const OPTIONS: { label: string; subtitle: string; value: ActivityLevel }[] = [
  {
    label: "Mostly sedentary",
    subtitle: "Little to no exercise",
    value: "sedentary",
  },
  {
    label: "Lightly active",
    subtitle: "Light exercise 1-2 days/week",
    value: "light",
  },
  {
    label: "Moderately active",
    subtitle: "Moderate exercise 3-4 days/week",
    value: "moderate",
  },
  {
    label: "Very active",
    subtitle: "Hard exercise 5-6 days/week",
    value: "active",
  },
  {
    label: "Athlete",
    subtitle: "Intense training almost daily",
    value: "athlete",
  },
];

type Props = {
  value: ActivityLevel | null;
  onChange: (value: ActivityLevel) => void;
};

export function ActivityStep({ value, onChange }: Props) {
  return (
    <View>
      {OPTIONS.map((option) => (
        <OnboardingOption
          key={option.value}
          label={option.label}
          subtitle={option.subtitle}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}
