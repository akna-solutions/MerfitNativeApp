import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { QuickStat } from "../types";

const ICONS: Record<QuickStat["icon"], keyof typeof Ionicons.glyphMap> = {
  scale: "speedometer-outline",
  flame: "flame-outline",
  trophy: "flash-outline",
  barbell: "barbell-outline",
};

type Props = { stats: QuickStat[] };

export function QuickStats({ stats }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>Quick Stats</Text>
      <View style={styles.grid}>
        {stats.map((stat) => (
          <View key={stat.id} style={styles.card}>
            <Ionicons
              name={ICONS[stat.icon]}
              size={18}
              color={colors.electricBlue}
            />
            <Text style={styles.value}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 28 },
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
