import { View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";
import { Goal } from "../types";

// Yalnizca uc ana hedef sunulur; kardiyo bir hedef degil, programin bileseni olarak eklenir.
const OPTIONS: { label: string; subtitle: string; value: Goal }[] = [
  { label: "Kas Geliştirme", subtitle: "Kas kütleni artırmaya odaklan", value: "build_muscle" },
  { label: "Güçlenme", subtitle: "Ana hareketlerde daha fazla ağırlık kaldır", value: "get_stronger" },
  { label: "Yağ Kaybı", subtitle: "Kasını koruyarak yağ oranını azalt", value: "lose_weight" },
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
          subtitle={option.subtitle}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}
