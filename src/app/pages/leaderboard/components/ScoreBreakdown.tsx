import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { ScoreBreakdownItem } from "../types";

type Props = { items: ScoreBreakdownItem[] };

export function ScoreBreakdown({ items }: Props) {
  const total = items.reduce((sum, item) => sum + item.points, 0);
  const max = Math.max(...items.map((item) => item.points), 1);

  return (
    <View>
      <Text style={styles.sectionTitle}>Puanın nasıl hesaplanıyor</Text>

      <View style={styles.card}>
        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>+{item.points.toLocaleString()}</Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${(item.points / max) * 100}%` },
                ]}
              />
            </View>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Toplam</Text>
          <Text style={styles.totalValue}>{total.toLocaleString()}</Text>
        </View>
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
    padding: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: { marginBottom: 16 },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { color: colors.textMuted, fontSize: 12 },
  value: { color: colors.textPrimary, fontSize: 12, fontWeight: "700" },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.progressTrack,
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.electricBlue },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  totalLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  totalValue: { color: colors.electricBlue, fontSize: 13, fontWeight: "700" },
});
