import { StyleSheet, Text, View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import { WEEKDAYS, Weekday } from "../../../../shared/profile/types";

export const MIN_AVAILABLE_DAYS = 2;

const DAY_LABELS: Record<Weekday, string> = {
  Mon: "Pazartesi",
  Tue: "Salı",
  Wed: "Çarşamba",
  Thu: "Perşembe",
  Fri: "Cuma",
  Sat: "Cumartesi",
  Sun: "Pazar",
};

type Props = {
  value: Weekday[];
  onChange: (value: Weekday[]) => void;
};

/**
 * Kullanici kac gun antrenman yapacagini secmez; yalnizca hangi gunler musait oldugunu isaretler.
 * Haftalik gun sayisini ve gunleri algoritma deneyim ve hedefe gore bu gunler arasindan belirler.
 */
export function FrequencyStep({ value, onChange }: Props) {
  const { colors } = useTheme();
  const toggle = (day: Weekday) =>
    onChange(value.includes(day) ? value.filter((d) => d !== day) : WEEKDAYS.filter((d) => d === day || value.includes(d)));

  return (
    <View>
      {WEEKDAYS.map((day) => (
        <OnboardingOption
          key={day}
          label={DAY_LABELS[day]}
          shape="check"
          selected={value.includes(day)}
          onPress={() => toggle(day)}
        />
      ))}
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {value.length > 0 && value.length < MIN_AVAILABLE_DAYS
          ? `En az ${MIN_AVAILABLE_DAYS} gün seç.`
          : "Haftada kaç gün antrenman yapacağını deneyimine ve hedefine göre biz belirleriz; programın yalnızca seçtiğin günlere yerleşir."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 12, lineHeight: 17, marginTop: 8 },
});
