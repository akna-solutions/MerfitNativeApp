import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { QuickStat } from "../types";

const ICONS: Record<QuickStat["icon"], keyof typeof Ionicons.glyphMap> = {
  scale: "speedometer-outline",
  flame: "flame-outline",
  trophy: "flash-outline",
  barbell: "barbell-outline",
};

type Props = { stats: QuickStat[] };

export function QuickStats({ stats }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Hızlı İstatistikler</Text>
      <View style={styles.grid}>
        {stats.map((stat) => (
          <View key={stat.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons
              name={ICONS[stat.icon]}
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.value, { color: colors.text }]}>{stat.value}</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 28 },
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
