import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  goal: string;
  description: string;
  onChangeGoal: () => void;
};

export function FitnessGoalCard({ goal, description, onChangeGoal }: Props) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Fitness Goal</Text>

      <View style={styles.card}>
        <Text style={styles.goal}>{goal}</Text>
        <Text style={styles.description}>{description}</Text>

        <Pressable onPress={onChangeGoal} style={styles.changeRow}>
          <Text style={styles.changeLabel}>Change goal</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
        </Pressable>
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
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  goal: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },
  description: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  changeLabel: { color: colors.electricBlue, fontSize: 13, fontWeight: "600" },
});
