import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { Workout } from "../types";
import { WorkoutCard } from "./WorkoutCard";

type Props = {
  title: string;
  /** Basligin altinda gosterilen kisa aciklama (opsiyonel). */
  subtitle?: string;
  workouts: Workout[];
  onSelect: (workout: Workout) => void;
  onSeeAll?: () => void;
};

export function WorkoutGrid({ title, subtitle, workouts, onSelect, onSeeAll }: Props) {
  const { colors } = useTheme();
  if (workouts.length === 0) return null;

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>Tümünü gör</Text>
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
  headerText: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 4 },
  seeAll: { fontSize: 12, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});
