import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  pointsToNextRank: number;
  nextRank: number;
};

export function MotivationCard({ pointsToNextRank, nextRank }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        #{nextRank} sıraya sadece{" "}
        <Text style={[styles.accent, { color: colors.primary }]}>
          {pointsToNextRank.toLocaleString()} puan
        </Text>{" "}
        kaldı.
      </Text>
      <Text style={[styles.subtext, { color: colors.textSecondary }]}>Devam et.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  accent: { fontWeight: "700" },
  subtext: { fontSize: 12, marginTop: 4 },
});
