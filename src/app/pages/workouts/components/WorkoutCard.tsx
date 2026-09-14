import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { Workout } from "../types";

type Props = {
  workout: Workout;
  onPress: () => void;
};

export function WorkoutCard({ workout, onPress }: Props) {
  const { colors } = useTheme();
  const [saved, setSaved] = useState(false);

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View>
        <Image source={{ uri: workout.imageUrl }} style={styles.image} />
        <Pressable
          onPress={() => setSaved((prev) => !prev)}
          hitSlop={8}
          style={styles.bookmark}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={15}
            color={saved ? colors.primary : "#FFFFFF"}
          />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {workout.title}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {workout.duration} dk • {workout.difficulty}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "47.5%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  image: { width: "100%", height: 110 },
  bookmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5,5,5,0.55)",
  },
  body: { padding: 12 },
  title: { fontSize: 13, fontWeight: "700" },
  meta: { fontSize: 11, marginTop: 4 },
});
