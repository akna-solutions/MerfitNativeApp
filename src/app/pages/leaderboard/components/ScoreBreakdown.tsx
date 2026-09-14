import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { ScoreBreakdownItem } from "../types";

type Props = { items: ScoreBreakdownItem[] };

export function ScoreBreakdown({ items }: Props) {
  const { colors } = useTheme();
  const total = items.reduce((sum, item) => sum + item.points, 0);
  const max = Math.max(...items.map((item) => item.points), 1);

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Puanın nasıl hesaplanıyor</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{item.label}</Text>
              <Text style={[styles.value, { color: colors.text }]}>+{item.points.toLocaleString()}</Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${(item.points / max) * 100}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
          </View>
        ))}

        <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Toplam</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>{total.toLocaleString()}</Text>
        </View>
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
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { marginBottom: 16 },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { fontSize: 12 },
  value: { fontSize: 12, fontWeight: "700" },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: 3 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: { fontSize: 13, fontWeight: "700" },
  totalValue: { fontSize: 13, fontWeight: "700" },
});
