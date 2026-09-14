import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { Workout } from "../types";

type Props = {
  workout: Workout;
  onPress: () => void;
};

export function FeaturedWorkout({ workout, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Öne Çıkan</Text>

      <ImageBackground
        source={{ uri: workout.imageUrl }}
        style={[styles.card, { borderColor: colors.border }]}
        imageStyle={styles.image}
      >
        <LinearGradient
          colors={["rgba(5,5,5,0)", "rgba(5,5,5,0.5)", "rgba(5,5,5,0.94)"]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          <Text style={styles.title}>{workout.title}</Text>
          {workout.tagline ? (
            <Text style={styles.tagline}>{workout.tagline}</Text>
          ) : null}
          <Text style={styles.meta}>
            {workout.duration} dk • {workout.difficulty}
          </Text>

          <Pressable onPress={onPress} style={[styles.cta, { backgroundColor: colors.primaryPressed }]}>
            <Text style={styles.ctaLabel}>Antrenmana Başla</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </ImageBackground>
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
    height: 260,
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "flex-end",
    borderWidth: StyleSheet.hairlineWidth,
  },
  image: { borderRadius: 24 },
  content: { padding: 20 },
  title: { color: "#FFFFFF", fontSize: 21, fontWeight: "700" },
  tagline: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 6 },
  meta: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 8 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 16,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  ctaLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});
