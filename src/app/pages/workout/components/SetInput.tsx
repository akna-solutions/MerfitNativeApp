import { StyleSheet, Text, View } from "react-native";

import { OnboardingInput } from "../../onboarding/components/OnboardingInput";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  setNumber: number;
  totalSets: number;
  weight: string;
  onWeightChange: (value: string) => void;
  reps: string;
  onRepsChange: (value: string) => void;
};

export function SetInput({
  setNumber,
  totalSets,
  weight,
  onWeightChange,
  reps,
  onRepsChange,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        SET {setNumber} / {totalSets}
      </Text>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Ağırlık (kg)</Text>
          <OnboardingInput
            value={weight}
            onChangeText={(text) =>
              onWeightChange(text.replace(/[^0-9.]/g, ""))
            }
            keyboardType="decimal-pad"
            placeholder="0"
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tekrar</Text>
          <OnboardingInput
            value={reps}
            onChangeText={(text) =>
              onRepsChange(text.replace(/[^0-9]/g, "").slice(0, 3))
            }
            keyboardType="number-pad"
            placeholder="0"
            style={styles.input}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 22,
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textAlign: "center",
    marginBottom: 16,
  },
  row: { flexDirection: "row", gap: 12 },
  field: { flex: 1 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: { textAlign: "center", fontSize: 22 },
});
