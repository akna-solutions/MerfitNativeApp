import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

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
  const { colors } = useTheme();
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
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Genel Bakış</Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name={item.icon} size={18} color={colors.primary} />
            <Text style={[styles.value, { color: colors.text }]}>{item.value}</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{item.label}</Text>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
  },
  label: { fontSize: 11, marginTop: 2 },
});
