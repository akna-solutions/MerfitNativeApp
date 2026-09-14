import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = { workoutsThisMonth: number };

export function MotivationalCard({ workoutsThisMonth }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Harika gidiyorsun.</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Bu ay{" "}
        <Text style={[styles.accent, { color: colors.primary }]}>{workoutsThisMonth} antrenman</Text>{" "}
        tamamladın. Bu ivmeyi sürdür.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 14, fontWeight: "700" },
  body: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  accent: { fontWeight: "700" },
});
