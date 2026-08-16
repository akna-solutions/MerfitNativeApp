import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

const INSIGHTS: string[] = [
  "You're improving consistently.",
  "Your strength increased 12% this month.",
  "Your workout consistency is better than last month.",
];

export function PersonalInsights() {
  return (
    <View>
      <Text style={styles.sectionTitle}>Your Insights</Text>
      <View style={styles.card}>
        {INSIGHTS.map((insight, index) => (
          <Text
            key={insight}
            style={[styles.insight, index === 0 && styles.insightPrimary]}
          >
            {insight}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 10,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  insight: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  insightPrimary: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
});
