import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useReducedMotion } from "../../../../shared/motion/useReducedMotion";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import { useImageCycle } from "./useImageCycle";

type Props = {
  /** Bugunun egzersiz/antrenman gorselleri (usableImageUrls ile suzulmus). */
  images: string[];
  badge: string;
  title: string;
  meta?: string | null;
  ctaLabel: string;
  /** Bugunun antrenmani tamamlandiysa kart "tamamlandi" vurgusuyla gosterilir. */
  completed?: boolean;
  onPress: () => void;
  testID?: string;
};

/**
 * Ana sayfadaki yarim genislikli "Antrenmana Başla" karti. Bugunun egzersiz gorselleri yumusak
 * gecislerle doner; okunabilirlik icin altta koyu gradient vardir. Gorsel yoksa veya yuklenemezse
 * tema renginde gradient ve ikon gosterilir.
 */
export function TodayStartCard({ images, badge, title, meta, ctaLabel, completed = false, onPress, testID }: Props) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const { current, markFailed } = useImageCycle(images, { paused: reducedMotion });

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${badge}: ${title}. ${ctaLabel}`}
      style={({ pressed }) => [
        styles.card,
        { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.92 : 1 },
      ]}
    >
      {current ? (
        <Image
          testID={testID ? `${testID}-image` : undefined}
          source={{ uri: current }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={reducedMotion ? 0 : { duration: 700, effect: "cross-dissolve" }}
          onError={() => markFailed(current)}
          accessible={false}
        />
      ) : (
        <LinearGradient
          testID={testID ? `${testID}-fallback` : undefined}
          colors={[colors.primary, colors.primaryPressed]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.fallbackIcon}>
            <Ionicons name="barbell" size={44} color="rgba(255,255,255,0.28)" />
          </View>
        </LinearGradient>
      )}

      <LinearGradient
        colors={["rgba(5,5,7,0.15)", "rgba(5,5,7,0.55)", "rgba(5,5,7,0.92)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={[styles.badge, completed && styles.badgeDone]}>
          <Text style={styles.badgeLabel}>{completed ? `${badge} · ✓` : badge}</Text>
        </View>
        <View>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {meta ? <Text style={styles.meta} numberOfLines={1}>{meta}</Text> : null}
          <View style={[styles.cta, { backgroundColor: completed ? "rgba(255,255,255,0.18)" : colors.primary }]}>
            <Text style={styles.ctaLabel} numberOfLines={1}>{ctaLabel}</Text>
            <Ionicons name={completed ? "refresh" : "play"} size={13} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 208,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  fallbackIcon: { position: "absolute", right: 14, top: 14 },
  content: { flex: 1, padding: 14, justifyContent: "space-between" },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  badgeDone: { backgroundColor: "rgba(34,197,94,0.55)" },
  badgeLabel: { color: "#FFFFFF", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  title: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", lineHeight: 20 },
  meta: { color: "rgba(255,255,255,0.78)", fontSize: 11, marginTop: 3 },
  cta: {
    marginTop: 10,
    minHeight: 34,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  ctaLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
});
