import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  consumedCalories: number;
  dailyCalories: number;
};

export function CalorieCard({ consumedCalories, dailyCalories }: Props) {
  const { colors } = useTheme();
  const remaining = Math.max(0, dailyCalories - consumedCalories);
  const ratio =
    dailyCalories > 0 ? Math.min(1, consumedCalories / dailyCalories) : 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.value, { color: colors.text }]}>{remaining.toLocaleString()}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>kalan kcal</Text>

      <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: colors.primary }]} />
      </View>

      <Text style={[styles.meta, { color: colors.text }]}>
        {consumedCalories.toLocaleString()} / {dailyCalories.toLocaleString()}{" "}
        kcal
      </Text>
      <Text style={[styles.caption, { color: colors.textSecondary }]}>Günlük kalori hedefi</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  value: { fontSize: 38, fontWeight: "700" },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  track: {
    alignSelf: "stretch",
    height: 8,
    borderRadius: 4,
    marginTop: 18,
    overflow: "hidden",
  },
  fill: { height: 8, borderRadius: 4 },
  meta: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
  },
  caption: { fontSize: 11, marginTop: 3 },
});
