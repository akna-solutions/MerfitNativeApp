import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { Workout } from "../types";
import { WorkoutCard } from "./WorkoutCard";

type Props = {
  title: string;
  workouts: Workout[];
  onSelect: (workout: Workout) => void;
  onSeeAll?: () => void;
};

export function WorkoutGrid({ title, workouts, onSelect, onSeeAll }: Props) {
  if (workouts.length === 0) return null;

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.seeAll}>Tümünü gör</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.grid}>
        {workouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            onPress={() => onSelect(workout)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  seeAll: { color: colors.electricBlue, fontSize: 12, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});
