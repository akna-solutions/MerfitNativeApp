import { StyleSheet, Text, View } from "react-native";

import { OnboardingInput } from "../../onboarding/components/OnboardingInput";
import { colors } from "../theme";

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
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        SET {setNumber} OF {totalSets}
      </Text>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>Weight (kg)</Text>
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
          <Text style={styles.label}>Reps</Text>
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
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textAlign: "center",
    marginBottom: 16,
  },
  row: { flexDirection: "row", gap: 12 },
  field: { flex: 1 },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: { textAlign: "center", fontSize: 22 },
});
