import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

const DAY_LABELS = ["P", "S", "Ç", "P", "C", "C", "P"];

type Props = { days: boolean[] };

export function WeeklyActivity({ days }: Props) {
  const completedCount = days.filter(Boolean).length;

  return (
    <View>
      <Text style={styles.sectionTitle}>Bu Hafta</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          {days.map((completed, index) => (
            <View key={index} style={styles.dayColumn}>
              <View style={[styles.dot, completed && styles.dotActive]} />
              <Text style={styles.dayLabel}>{DAY_LABELS[index]}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.caption}>Bu hafta {completedCount} antrenman</Text>
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
  row: { flexDirection: "row", justifyContent: "space-between" },
  dayColumn: { alignItems: "center", gap: 8 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  dotActive: { backgroundColor: colors.electricBlue },
  dayLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  caption: { color: colors.textMuted, fontSize: 12, marginTop: 16 },
});
