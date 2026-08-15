import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "../theme";
import { WELCOME_VIDEOS } from "../videos";

/** Picks a random video, nudging away from the last one shown per app run. */
function pickVideo(): number | null {
  if (WELCOME_VIDEOS.length === 0) return null;
  const index = Math.floor(Math.random() * WELCOME_VIDEOS.length);
  return WELCOME_VIDEOS[index];
}

export function BackgroundVideo() {
  // Chosen once per mount (once per app open), not on every re-render.
  const source = useMemo(() => pickVideo(), []);
  const lastSource = useRef(source);
  lastSource.current = source;

  const player = useVideoPlayer(source ?? null, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  if (!source) {
    // No videos dropped in yet (see videos/index.ts) — fall back to a
    // plain cinematic backdrop instead of a blank/broken screen.
    return (
      <LinearGradient
        colors={["#0B0B12", colors.background, "#000000"]}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <VideoView
        style={[StyleSheet.absoluteFill, styles.video]}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
        showsTimecodes={false}
      />
      <View style={styles.dim} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.55)", "#000000"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  video: {
    opacity: 0.35,
  },
  dim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
});
