import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { BodyMetric } from "../types";

type Props = {
  metrics: BodyMetric[];
  onViewAll: () => void;
};

export function BodyMetrics({ metrics, onViewAll }: Props) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Vücut Ölçümleri</Text>

      <View style={styles.card}>
        {metrics.map((metric, index) => (
          <View
            key={metric.id}
            style={[styles.row, index === metrics.length - 1 && styles.rowLast]}
          >
            <Text style={styles.label}>{metric.label}</Text>
            <Text style={styles.value}>{metric.value}</Text>
          </View>
        ))}

        <Pressable onPress={onViewAll} hitSlop={8} style={styles.viewAll}>
          <Text style={styles.viewAllLabel}>Tüm ölçümleri gör</Text>
          <Ionicons
            name="arrow-forward"
            size={13}
            color={colors.electricBlue}
          />
        </Pressable>
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
    paddingTop: 4,
    paddingBottom: 16,
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
  value: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  viewAllLabel: { color: colors.electricBlue, fontSize: 12, fontWeight: "600" },
});
