import { View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";
import { Purpose } from "../types";

const OPTIONS: { label: string; subtitle: string; value: Purpose }[] = [
  {
    label: "MB Fit + MB Shop",
    subtitle: "Kişisel antrenman ve beslenme planı, ilerleme takibi ve alışveriş.",
    value: "fitness",
  },
  {
    label: "Sadece alışveriş",
    subtitle: "Boy, kilo gibi bilgiler sorulmaz. MB Fit'i kullanmak istediğinde profilini sonra tamamlarsın.",
    value: "shopping",
  },
];

type Props = {
  value: Purpose;
  onChange: (value: Purpose) => void;
};

export function PurposeStep({ value, onChange }: Props) {
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
