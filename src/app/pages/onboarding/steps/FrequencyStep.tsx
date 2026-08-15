import { View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";

const OPTIONS: { label: string; value: number }[] = [
  { label: "2 days / week", value: 2 },
  { label: "3 days / week", value: 3 },
  { label: "4 days / week", value: 4 },
  { label: "5 days / week", value: 5 },
  { label: "6 days / week", value: 6 },
  { label: "Every day", value: 7 },
];

type Props = {
  value: number | null;
  onChange: (value: number) => void;
};

export function FrequencyStep({ value, onChange }: Props) {
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
