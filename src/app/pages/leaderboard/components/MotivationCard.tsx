import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  pointsToNextRank: number;
  nextRank: number;
};

export function MotivationCard({ pointsToNextRank, nextRank }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>
        #{nextRank} sıraya sadece{" "}
        <Text style={styles.accent}>
          {pointsToNextRank.toLocaleString()} puan
        </Text>{" "}
        kaldı.
      </Text>
      <Text style={styles.subtext}>Devam et.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  accent: { color: colors.electricBlue, fontWeight: "700" },
  subtext: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
