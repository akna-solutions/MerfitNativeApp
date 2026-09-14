import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { Image, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  video: number | string | null;
  imageUrl: string;
};

export function ExerciseVideo({ video, imageUrl }: Props) {
  const { colors } = useTheme();
  // Hook her zaman çağrılmalı; video yoksa player boş kalır ve VideoView
  // render edilmez (aşağıda source'a göre dallanıyoruz).
  const player = useVideoPlayer(video ?? null, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  if (video) {
    return (
      <View style={[styles.wrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <VideoView
          style={styles.media}
          player={player}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Image source={{ uri: imageUrl }} style={styles.media} />
      <LinearGradient
        colors={["rgba(5,5,5,0)", "rgba(5,5,5,0.45)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.placeholderBadge}>
        <Ionicons
          name="play-circle-outline"
          size={14}
          color="#FFFFFF"
        />
        <Text style={styles.placeholderLabel}>Egzersiz gösterimi</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 260,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  media: { width: "100%", height: "100%" },
  placeholderBadge: {
    position: "absolute",
    left: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(5,5,5,0.55)",
  },
  placeholderLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
});
