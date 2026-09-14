import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  points: number;
  weeklyChange: number;
  rank: number;
  onPress: () => void;
};

export function ScoreCard({ points, weeklyChange, rank, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>MB FIT Puanın</Text>
        <Text style={[styles.points, { color: colors.text }]}>{points.toLocaleString()}</Text>
        <Text style={[styles.change, { color: colors.primary }]}>+{weeklyChange} bu hafta</Text>
        <Text style={[styles.rank, { color: colors.textSecondary }]}>🇹🇷 Türkiye'de #{rank}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,168,255,0.28)",
  },
  textBlock: { flex: 1 },
  title: { fontSize: 12, fontWeight: "600" },
  points: {
    fontSize: 30,
    fontWeight: "700",
    marginTop: 6,
  },
  change: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  rank: { fontSize: 12, marginTop: 10 },
});
