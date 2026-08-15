import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  currentWeight: number;
  monthlyChange: number;
};

export function CurrentWeightCard({ currentWeight, monthlyChange }: Props) {
  const improving = monthlyChange < 0;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Current Weight</Text>
      <Text style={styles.value}>{currentWeight} kg</Text>

      <View style={styles.changeRow}>
        <Ionicons
          name={improving ? "arrow-down" : "arrow-up"}
          size={13}
          color={colors.electricBlue}
        />
        <Text style={styles.changeText}>
          {Math.abs(monthlyChange)} kg this month
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
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  value: {
    color: colors.textPrimary,
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
  changeText: { color: colors.electricBlue, fontSize: 12, fontWeight: "600" },
});
