import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  consumedCalories: number;
  dailyCalories: number;
};

export function CalorieCard({ consumedCalories, dailyCalories }: Props) {
  const remaining = Math.max(0, dailyCalories - consumedCalories);
  const ratio =
    dailyCalories > 0 ? Math.min(1, consumedCalories / dailyCalories) : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.value}>{remaining.toLocaleString()}</Text>
      <Text style={styles.label}>kcal left</Text>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>

      <Text style={styles.meta}>
        {consumedCalories.toLocaleString()} / {dailyCalories.toLocaleString()}{" "}
        kcal
      </Text>
      <Text style={styles.caption}>Daily calorie goal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  value: { color: colors.textPrimary, fontSize: 38, fontWeight: "700" },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  track: {
    alignSelf: "stretch",
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.progressTrack,
    marginTop: 18,
    overflow: "hidden",
  },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.electricBlue },
  meta: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
  },
  caption: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
});
