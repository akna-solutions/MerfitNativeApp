import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  workouts: number;
  calories: number;
  streak: number;
  trainingMinutes: number;
};

export function OverviewStats({
  workouts,
  calories,
  streak,
  trainingMinutes,
}: Props) {
  const items: {
    id: string;
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      id: "workouts",
      label: "Antrenman",
      value: `${workouts}`,
      icon: "barbell-outline",
    },
    {
      id: "calories",
      label: "Kalori",
      value: calories.toLocaleString(),
      icon: "flame-outline",
    },
    {
      id: "streak",
      label: "Seri",
      value: `${streak} gün`,
      icon: "flash-outline",
    },
    {
      id: "minutes",
      label: "Antrenman Süresi",
      value: `${trainingMinutes} dk`,
      icon: "time-outline",
    },
  ];

  return (
    <View>
      <Text style={styles.sectionTitle}>Genel Bakış</Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Ionicons name={item.icon} size={18} color={colors.electricBlue} />
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
  },
  label: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
});
