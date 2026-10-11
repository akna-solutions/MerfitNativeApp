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
  /** Vücut ağırlığı egzersizi: ağırlık alanı opsiyoneldir (ek ağırlık). */
  weightOptional?: boolean;
  /** "Geçen sefer" referansı (örn. "40 kg × 10"); yoksa gösterilmez. */
  lastSetLabel?: string | null;
  /** Kişisel rekor (örn. "50 kg × 5"); yoksa gösterilmez. */
  bestLabel?: string | null;
  error?: string | null;
};

/** Türkçe klavyede ondalık ayırıcı virgül gelir; "42,5" -> "42.5" ve tek bir nokta bırakır. */
function sanitizeWeight(text: string) {
  const normalized = text.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const [whole, ...rest] = normalized.split(".");
  const decimals = rest.join("").slice(0, 2);
  return rest.length > 0 ? `${whole.slice(0, 4)}.${decimals}` : whole.slice(0, 4);
}

export function SetInput({
  setNumber,
  totalSets,
  weight,
  onWeightChange,
  reps,
  onRepsChange,
  weightOptional = false,
  lastSetLabel,
  bestLabel,
  error,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        SET {setNumber} / {totalSets}
      </Text>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {weightOptional ? "Ek ağırlık (kg)" : "Ağırlık (kg)"}
          </Text>
          <OnboardingInput
            value={weight}
            onChangeText={(text) => onWeightChange(sanitizeWeight(text))}
            keyboardType="decimal-pad"
            placeholder={weightOptional ? "Yok" : "kg"}
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

      {error ? (
        <Text style={[styles.error, { color: colors.danger }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {lastSetLabel || bestLabel ? (
        <View style={styles.history}>
          {lastSetLabel ? (
            <Text style={[styles.historyText, { color: colors.textSecondary }]}>
              Geçen sefer: <Text style={{ color: colors.text }}>{lastSetLabel}</Text>
            </Text>
          ) : null}
          {bestLabel ? (
            <Text style={[styles.historyText, { color: colors.textSecondary }]}>
              Rekorun: <Text style={{ color: colors.text }}>{bestLabel}</Text>
            </Text>
          ) : null}
        </View>
      ) : null}
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
  error: { fontSize: 12, fontWeight: "600", textAlign: "center", marginTop: 12 },
  history: { marginTop: 14, gap: 4, alignItems: "center" },
  historyText: { fontSize: 12 },
});
