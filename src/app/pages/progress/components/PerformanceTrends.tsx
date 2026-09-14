import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

const TRENDS: { label: string; value: string; positive: boolean }[] = [
  { label: "Güç Trendi", value: "+%12", positive: true },
  { label: "Antrenman Düzenliliği", value: "+%8", positive: true },
  { label: "Kilo Trendi", value: "-3,4 kg", positive: true },
];

export function PerformanceTrends() {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Performans Trendleri</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {TRENDS.map((trend, index) => (
          <View
            key={trend.label}
            style={[
              styles.row,
              { borderBottomColor: colors.border },
              index === TRENDS.length - 1 && styles.rowLast,
            ]}
          >
            <Text style={[styles.label, { color: colors.textSecondary }]}>{trend.label}</Text>
            <View style={styles.valueRow}>
              <Ionicons
                name={trend.positive ? "trending-up" : "trending-down"}
                size={13}
                color={colors.primary}
              />
              <Text style={[styles.value, { color: colors.text }]}>{trend.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: { borderBottomWidth: 0 },
  label: { fontSize: 13 },
  valueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  value: { fontSize: 13, fontWeight: "700" },
});
