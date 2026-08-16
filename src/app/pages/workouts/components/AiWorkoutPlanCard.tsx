import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

export function AiWorkoutPlanCard() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons
          name="sparkles-outline"
          size={16}
          color={colors.electricBlue}
        />
        <Text style={styles.title}>AI WORKOUT PLAN</Text>
      </View>
      <Text style={styles.description}>
        Get a workout plan built around your goals, experience and progress.
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
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: {
    color: colors.electricBlue,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  description: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
});
