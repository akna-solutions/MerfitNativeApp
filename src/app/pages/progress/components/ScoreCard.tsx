import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  points: number;
  weeklyChange: number;
  rank: number;
  onPress: () => void;
};

export function ScoreCard({ points, weeklyChange, rank, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>MERFIT Puanın</Text>
        <Text style={styles.points}>{points.toLocaleString()}</Text>
        <Text style={styles.change}>+{weeklyChange} this week</Text>
        <Text style={styles.rank}>🇹🇷 #{rank} in Türkiye</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
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
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: "rgba(0,168,255,0.28)",
  },
  textBlock: { flex: 1 },
  title: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  points: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "700",
    marginTop: 6,
  },
  change: {
    color: colors.electricBlue,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  rank: { color: colors.textMuted, fontSize: 12, marginTop: 10 },
});
