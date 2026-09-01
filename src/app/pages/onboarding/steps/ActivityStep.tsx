import { View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";
import { ActivityLevel } from "../types";

const OPTIONS: { label: string; subtitle: string; value: ActivityLevel }[] = [
  {
    label: "Genellikle hareketsiz",
    subtitle: "Neredeyse hiç egzersiz yok",
    value: "sedentary",
  },
  {
    label: "Hafif aktif",
    subtitle: "Haftada 1-2 gün hafif egzersiz",
    value: "light",
  },
  {
    label: "Orta düzeyde aktif",
    subtitle: "Haftada 3-4 gün orta düzeyde egzersiz",
    value: "moderate",
  },
  {
    label: "Çok aktif",
    subtitle: "Haftada 5-6 gün yoğun egzersiz",
    value: "active",
  },
  {
    label: "Sporcu",
    subtitle: "Neredeyse her gün yoğun antrenman",
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
