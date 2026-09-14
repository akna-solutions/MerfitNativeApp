import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { WorkoutSummary } from "../types";

type Props = {
  workouts: WorkoutSummary[];
  onSelect: (workout: WorkoutSummary) => void;
};

export function RecommendedWorkouts({ workouts, onSelect }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Senin için önerilenler</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {workouts.map((workout) => (
          <Pressable
            key={workout.id}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => onSelect(workout)}
          >
            <Image source={{ uri: workout.imageUrl }} style={styles.image} />
            <View style={styles.body}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {workout.title}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  image: { width: "100%", height: 96 },
  body: { padding: 12 },
  title: { fontSize: 13, fontWeight: "700" },
  meta: { fontSize: 11, marginTop: 4 },
});
