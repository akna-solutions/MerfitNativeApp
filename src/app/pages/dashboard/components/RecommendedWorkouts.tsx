import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { colors } from "../theme";
import { WorkoutSummary } from "../types";

type Props = {
  workouts: WorkoutSummary[];
  onSelect: (workout: WorkoutSummary) => void;
};

export function RecommendedWorkouts({ workouts, onSelect }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>Recommended for you</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {workouts.map((workout) => (
          <Pressable
            key={workout.id}
            style={styles.card}
            onPress={() => onSelect(workout)}
          >
            <Image source={{ uri: workout.imageUrl }} style={styles.image} />
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={1}>
                {workout.title}
              </Text>
              <Text style={styles.meta}>
                {workout.duration} · {workout.difficulty}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 168;

const styles = StyleSheet.create({
  wrapper: { marginTop: 28 },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  list: { paddingHorizontal: 24, gap: 12 },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  image: { width: "100%", height: 96 },
  body: { padding: 12 },
  title: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  meta: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
});
