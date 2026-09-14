import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

const INSIGHTS: string[] = [
  "İstikrarlı bir şekilde gelişiyorsun.",
  "Gücün bu ay %12 arttı.",
  "Antrenman düzenliliğin geçen aydan daha iyi.",
];

export function PersonalInsights() {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Kişisel Analizlerin</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {INSIGHTS.map((insight, index) => (
          <Text
            key={insight}
            style={[
              styles.insight,
              { color: colors.textSecondary },
              index === 0 && [styles.insightPrimary, { color: colors.text }],
            ]}
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
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  insight: { fontSize: 13, lineHeight: 19 },
  insightPrimary: {
    fontSize: 15,
    fontWeight: "700",
  },
});
