import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  goal: string;
  description: string;
  onChangeGoal: () => void;
};

export function FitnessGoalCard({ goal, description, onChangeGoal }: Props) {
  const { colors } = useTheme();

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Fitness Hedefi</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.goal, { color: colors.text }]}>{goal}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>

        <Pressable onPress={onChangeGoal} style={[styles.changeRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.changeLabel, { color: colors.primary }]}>Hedefi değiştir</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.textSecondary} />
        </Pressable>
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  goal: { fontSize: 18, fontWeight: "700" },
  description: { fontSize: 12, marginTop: 4 },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  changeLabel: { fontSize: 13, fontWeight: "600" },
});
