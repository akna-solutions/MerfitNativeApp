import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  experience: string;
  activityLevel: string;
  trainingDays: number;
  workoutLocation: string;
  equipment: string[];
};

export function TrainingProfile({
  experience,
  activityLevel,
  trainingDays,
  workoutLocation,
  equipment,
}: Props) {
  const { colors } = useTheme();
  const rows = [
    { label: "Deneyim", value: experience },
    { label: "Aktivite Seviyesi", value: activityLevel },
    { label: "Antrenman Günleri", value: `${trainingDays} / hafta` },
    { label: "Konum", value: workoutLocation },
    { label: "Ekipman", value: equipment.join(", ") || "Yok" },
  ];

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Antrenman Profili</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {rows.map((row, index) => (
          <View
            key={row.label}
            style={[
              styles.row,
              { borderBottomColor: colors.border },
              index === rows.length - 1 && styles.rowLast,
            ]}
          >
            <Text style={[styles.label, { color: colors.textSecondary }]}>{row.label}</Text>
            <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
              {row.value}
            </Text>
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
    gap: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  label: { fontSize: 13 },
  value: {
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },
});
