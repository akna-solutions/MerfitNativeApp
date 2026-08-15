import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  workouts: number;
  streak: number;
  weight: number;
};

export function ProfileStats({ workouts, streak, weight }: Props) {
  const items = [
    { label: "Workouts", value: `${workouts}` },
    { label: "Streak", value: `${streak}` },
    { label: "Weight", value: `${weight}` },
  ];

  return (
    <View style={styles.card}>
      {items.map((item, index) => (
        <View key={item.label} style={styles.itemRow}>
          <View style={styles.item}>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
          {index < items.length - 1 ? <View style={styles.divider} /> : null}
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
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  itemRow: { flex: 1, flexDirection: "row", alignItems: "center" },
  item: { flex: 1, alignItems: "center" },
  value: { color: colors.textPrimary, fontSize: 17, fontWeight: "700" },
  label: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.border,
  },
});
