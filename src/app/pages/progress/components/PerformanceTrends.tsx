import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

const TRENDS: { label: string; value: string; positive: boolean }[] = [
  { label: "Güç Trendi", value: "+%12", positive: true },
  { label: "Antrenman Düzenliliği", value: "+%8", positive: true },
  { label: "Kilo Trendi", value: "-3,4 kg", positive: true },
];

export function PerformanceTrends() {
  return (
    <View>
      <Text style={styles.sectionTitle}>Performans Trendleri</Text>
      <View style={styles.card}>
        {TRENDS.map((trend, index) => (
          <View
            key={trend.label}
            style={[styles.row, index === TRENDS.length - 1 && styles.rowLast]}
          >
            <Text style={styles.label}>{trend.label}</Text>
            <View style={styles.valueRow}>
              <Ionicons
                name={trend.positive ? "trending-up" : "trending-down"}
                size={13}
                color={colors.electricBlue}
              />
              <Text style={styles.value}>{trend.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  label: { color: colors.textMuted, fontSize: 13 },
  valueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  value: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
});
