import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { Workout } from "../types";

type Props = {
  workout: Workout;
  onPress: () => void;
};

export function WorkoutCard({ workout, onPress }: Props) {
  const [saved, setSaved] = useState(false);

  return (
    <Pressable onPress={onPress} style={styles.card}>
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
            color={saved ? colors.electricBlue : "#FFFFFF"}
          />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {workout.title}
        </Text>
        <Text style={styles.meta}>
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
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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
  title: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  meta: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
});
