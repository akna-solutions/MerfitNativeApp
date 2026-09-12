import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../theme";
import { WorkoutSummary } from "../types";

type Props = {
  workout: WorkoutSummary;
  onPress: () => void;
};

export function WorkoutCard({ workout, onPress }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>Bugünkü Antrenman</Text>

      <ImageBackground
        source={{ uri: workout.imageUrl }}
        style={styles.card}
        imageStyle={styles.image}
      >
        <LinearGradient
          colors={["rgba(5,5,5,0)", "rgba(5,5,5,0.55)", "rgba(5,5,5,0.92)"]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          <Text style={styles.title}>{workout.title}</Text>
          <Text style={styles.meta}>
            {workout.duration} • {workout.meta}
          </Text>

          <Pressable onPress={onPress} style={styles.cta}>
            <Text style={styles.ctaLabel}>Antrenmana Başla</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 28, marginBottom: 12 },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    height: 220,
    borderRadius: 22,
    overflow: "hidden",
    justifyContent: "flex-end",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  image: { borderRadius: 22 },
  content: { padding: 18 },
  title: { color: "#FFFFFF", fontSize: 19, fontWeight: "700" },
  meta: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 4 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 14,
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: colors.buttonElectricBlue,
    gap: 8,
  },
  ctaLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});
