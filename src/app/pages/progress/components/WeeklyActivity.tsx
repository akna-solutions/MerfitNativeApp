import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

const DAY_LABELS = ["P", "S", "Ç", "P", "C", "C", "P"];

type Props = { days: boolean[] };

export function WeeklyActivity({ days }: Props) {
  const { colors } = useTheme();
  const completedCount = days.filter(Boolean).length;

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Bu Hafta</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}>
          {days.map((completed, index) => (
            <View key={index} style={styles.dayColumn}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: colors.inputBackground },
                  completed && { backgroundColor: colors.primary },
                ]}
              />
              <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{DAY_LABELS[index]}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>Bu hafta {completedCount} antrenman</Text>
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
  row: { flexDirection: "row", justifyContent: "space-between" },
  dayColumn: { alignItems: "center", gap: 8 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  dayLabel: { fontSize: 11, fontWeight: "600" },
  caption: { fontSize: 12, marginTop: 16 },
});
