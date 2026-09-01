import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

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
  const rows = [
    { label: "Deneyim", value: experience },
    { label: "Aktivite Seviyesi", value: activityLevel },
    { label: "Antrenman Günleri", value: `${trainingDays} / hafta` },
    { label: "Konum", value: workoutLocation },
    { label: "Ekipman", value: equipment.join(", ") || "Yok" },
  ];

  return (
    <View>
      <Text style={styles.sectionTitle}>Antrenman Profili</Text>

      <View style={styles.card}>
        {rows.map((row, index) => (
          <View
            key={row.label}
            style={[styles.row, index === rows.length - 1 && styles.rowLast]}
          >
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value} numberOfLines={1}>
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
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 20,
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
    gap: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  label: { color: colors.textMuted, fontSize: 13 },
  value: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },
});
