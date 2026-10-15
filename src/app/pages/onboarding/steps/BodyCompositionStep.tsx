import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { BodyFatAssessment } from "../../../../shared/bodyComposition/bodyFat";
import { OnboardingInput } from "../components/OnboardingInput";
import { Gender } from "../types";

export type BodyCompositionValues = {
  bodyFat: string;
  neck: string;
  waist: string;
  hip: string;
};

type Props = {
  gender: Gender | null;
  values: BodyCompositionValues;
  onChange: (key: keyof BodyCompositionValues, value: string) => void;
  errors: Partial<Record<keyof BodyCompositionValues, string>>;
  assessment: BodyFatAssessment;
};

function sanitize(text: string) {
  return text.replace(/[^0-9.,]/g, "").slice(0, 5);
}

/**
 * Opsiyonel vucut kompozisyonu adimi: bilinen yag orani veya US Navy tahmini icin boyun/bel (kadinda
 * kalca) olcumleri. Girilen degerler kayitla birlikte ilk olcum kaydi olarak saklanir.
 */
export function BodyCompositionStep({ gender, values, onChange, errors, assessment }: Props) {
  const { colors } = useTheme();
  const fields: { key: keyof BodyCompositionValues; label: string; placeholder: string }[] = [
    { key: "bodyFat", label: "Vücut yağ oranı (%)", placeholder: "Biliyorsan, ör. 18" },
    { key: "neck", label: "Boyun çevresi (cm)", placeholder: "ör. 38" },
    { key: "waist", label: "Bel çevresi (cm, göbek hizası)", placeholder: "ör. 84" },
    ...(gender === "female"
      ? [{ key: "hip" as const, label: "Kalça çevresi (cm)", placeholder: "ör. 98" }]
      : []),
  ];

  return (
    <View style={styles.container}>
      {fields.map((field) => (
        <View key={field.key} style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{field.label}</Text>
          <OnboardingInput
            value={values[field.key]}
            onChangeText={(text) => onChange(field.key, sanitize(text))}
            placeholder={field.placeholder}
            keyboardType="decimal-pad"
            accessibilityLabel={field.label}
          />
          {errors[field.key] ? (
            <Text style={[styles.error, { color: colors.danger }]}>{errors[field.key]}</Text>
          ) : null}
        </View>
      ))}
      {assessment.percentage !== null ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {assessment.source === "estimated"
            ? `Tahmini yağ oranın: %${assessment.percentage.toFixed(1)} (±${assessment.marginOfError} puan). Çevre ölçümlerinden hesaplanan tahmini bir değerdir.`
            : `Girdiğin yağ oranı: %${assessment.percentage.toFixed(1)}`}
        </Text>
      ) : (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Yağ oranını bilmiyorsan boyun ve bel{gender === "female" ? " ile kalça" : ""} ölçülerinden tahmin ederiz. Bu adımı atlayabilirsin.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
  error: { fontSize: 12 },
  hint: { fontSize: 12, lineHeight: 17 },
});
