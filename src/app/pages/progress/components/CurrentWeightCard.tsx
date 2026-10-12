import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  currentWeight: number;
  monthlyChange: number;
};

export function CurrentWeightCard({ currentWeight, monthlyChange }: Props) {
  const { colors } = useTheme();
  const improving = monthlyChange < 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Güncel Kilo</Text>
      <Text style={[styles.value, { color: colors.text }]}>
        {currentWeight > 0 ? `${currentWeight.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} kg` : "—"}
      </Text>

      <View style={styles.changeRow}>
        {monthlyChange !== 0 ? (
          <Ionicons
            name={improving ? "arrow-down" : "arrow-up"}
            size={13}
            color={colors.primary}
          />
        ) : null}
        <Text style={[styles.changeText, { color: colors.primary }]}>
          {monthlyChange !== 0
            ? `${Math.abs(monthlyChange).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} kg son 30 günde`
            : "Son 30 günde değişim yok"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 12, fontWeight: "600" },
  value: {
    fontSize: 40,
    fontWeight: "700",
    marginTop: 8,
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },
  changeText: { fontSize: 12, fontWeight: "600" },
});
