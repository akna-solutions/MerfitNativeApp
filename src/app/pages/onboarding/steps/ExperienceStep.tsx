import { View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";
import { TrainingExperience } from "../types";

const OPTIONS: {
  label: string;
  subtitle: string;
  value: TrainingExperience;
}[] = [
  {
    label: "Başlangıç",
    subtitle: "Yapılandırılmış antrenmana yeniyim",
    value: "beginner",
  },
  {
    label: "Orta",
    subtitle: "Düzenli olarak antrenman yapıyorum",
    value: "intermediate",
  },
  {
    label: "İleri",
    subtitle: "Ciddi antrenman deneyimim var",
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
