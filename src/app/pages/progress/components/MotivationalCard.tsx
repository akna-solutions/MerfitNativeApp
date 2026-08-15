import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = { workoutsThisMonth: number };

export function MotivationalCard({ workoutsThisMonth }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>You're doing great.</Text>
      <Text style={styles.body}>
        You've completed{" "}
        <Text style={styles.accent}>{workoutsThisMonth} workouts</Text> this
        month. Keep the momentum going.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  body: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  accent: { color: colors.electricBlue, fontWeight: "700" },
});
