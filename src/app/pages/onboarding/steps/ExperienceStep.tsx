import { View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";
import { TrainingExperience } from "../types";

const OPTIONS: {
  label: string;
  subtitle: string;
  value: TrainingExperience;
}[] = [
  {
    label: "Beginner",
    subtitle: "I'm new to structured training",
    value: "beginner",
  },
  {
    label: "Intermediate",
    subtitle: "I've been training consistently",
    value: "intermediate",
  },
  {
    label: "Advanced",
    subtitle: "I have significant training experience",
    value: "advanced",
  },
];

type Props = {
  value: TrainingExperience | null;
  onChange: (value: TrainingExperience) => void;
};

export function ExperienceStep({ value, onChange }: Props) {
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
