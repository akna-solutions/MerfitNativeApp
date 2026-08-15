import { View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";
import { Gender } from "../types";

const OPTIONS: { label: string; value: Gender }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

type Props = {
  value: Gender | null;
  onChange: (value: Gender) => void;
};

export function GenderStep({ value, onChange }: Props) {
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
