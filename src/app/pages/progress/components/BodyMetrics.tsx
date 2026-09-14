import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { BodyMetric } from "../types";

type Props = {
  metrics: BodyMetric[];
  onViewAll: () => void;
};

export function BodyMetrics({ metrics, onViewAll }: Props) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Vücut Ölçümleri</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {metrics.map((metric, index) => (
          <View
            key={metric.id}
            style={[
              styles.row,
              { borderBottomColor: colors.border },
              index === metrics.length - 1 && styles.rowLast,
            ]}
          >
            <Text style={[styles.label, { color: colors.textSecondary }]}>{metric.label}</Text>
            <Text style={[styles.value, { color: colors.text }]}>{metric.value}</Text>
          </View>
        ))}

        <Pressable onPress={onViewAll} hitSlop={8} style={styles.viewAll}>
          <Text style={[styles.viewAllLabel, { color: colors.primary }]}>Tüm ölçümleri gör</Text>
          <Ionicons
            name="arrow-forward"
            size={13}
            color={colors.primary}
          />
        </Pressable>
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
    paddingTop: 4,
    paddingBottom: 16,
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
  value: { fontSize: 14, fontWeight: "700" },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  viewAllLabel: { fontSize: 12, fontWeight: "600" },
});
