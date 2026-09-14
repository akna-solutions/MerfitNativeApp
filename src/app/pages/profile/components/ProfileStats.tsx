import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  workouts: number;
  streak: number;
  weight: number;
};

export function ProfileStats({ workouts, streak, weight }: Props) {
  const { colors } = useTheme();
  const items = [
    { label: "Antrenman", value: `${workouts}` },
    { label: "Seri", value: `${streak}` },
    { label: "Kilo", value: `${weight}` },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {items.map((item, index) => (
        <View key={item.label} style={styles.itemRow}>
          <View style={styles.item}>
            <Text style={[styles.value, { color: colors.text }]}>{item.value}</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{item.label}</Text>
          </View>
          {index < items.length - 1 ? (
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemRow: { flex: 1, flexDirection: "row", alignItems: "center" },
  item: { flex: 1, alignItems: "center" },
  value: { fontSize: 17, fontWeight: "700" },
  label: { fontSize: 11, marginTop: 3 },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
});
