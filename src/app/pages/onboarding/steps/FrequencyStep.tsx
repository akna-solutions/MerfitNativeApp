import { View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";

const OPTIONS: { label: string; value: number }[] = [
  { label: "Haftada 2 gün", value: 2 },
  { label: "Haftada 3 gün", value: 3 },
  { label: "Haftada 4 gün", value: 4 },
  { label: "Haftada 5 gün", value: 5 },
  { label: "Haftada 6 gün", value: 6 },
  { label: "Her gün", value: 7 },
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
