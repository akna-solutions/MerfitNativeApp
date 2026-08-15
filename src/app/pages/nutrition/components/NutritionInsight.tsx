import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = { onViewSuggestions: () => void };

export function NutritionInsight({ onViewSuggestions }: Props) {
  return (
    <Pressable onPress={onViewSuggestions} style={styles.card}>
      <View style={styles.header}>
        <Ionicons
          name="sparkles-outline"
          size={16}
          color={colors.electricBlue}
        />
        <Text style={styles.title}>MERFIT AI</Text>
      </View>

      <Text style={styles.message}>
        You're low on protein today. Try adding Greek yogurt, eggs or chicken to
        your next meal.
      </Text>

      <View style={styles.footer}>
        <Text style={styles.link}>View suggestions</Text>
        <Ionicons name="arrow-forward" size={13} color={colors.electricBlue} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: "rgba(0,168,255,0.28)",
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: {
    color: colors.electricBlue,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  message: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  footer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  link: { color: colors.electricBlue, fontSize: 12, fontWeight: "700" },
});
