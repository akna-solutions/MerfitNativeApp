import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { AchievementItem } from "../../services/api/types";
import { useReducedMotion } from "../motion/useReducedMotion";
import { useTheme } from "../theme/ThemeContext";
import { AchievementBadgeIcon } from "./AchievementBadgeIcon";

type Props = {
  achievement: AchievementItem | null;
  onClose: () => void;
};

const CONFETTI_COLORS = ["#3E7BFA", "#FF1414", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4"];
const CONFETTI_COUNT = 22;
const CONFETTI_MS = 1800;

/** Deterministik "rastgele" konfeti parcalari (her render'da ayni). */
function buildPieces() {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const r = seed - Math.floor(seed);
    return {
      key: i,
      left: `${(i / CONFETTI_COUNT) * 100 + r * 4}%` as const,
      drift: (r - 0.5) * 80,
      delay: Math.round(r * 300),
      rotate: 180 + r * 540,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.round(r * 5),
    };
  });
}

/**
 * Yeni rozet kazanildiginda kisa bir konfeti ile rozet simgesi, adi ve tebrik mesajini gosterir.
 * Hareketi azalt acikken konfeti oynatilmaz. Disariya dokunarak veya butonla kapatilir.
 */
export function AchievementCelebration({ achievement, onClose }: Props) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const pieces = useMemo(buildPieces, []);
  const progress = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!achievement) return;
    progress.setValue(0);
    pop.setValue(reducedMotion ? 1 : 0);
    if (reducedMotion) return;
    const animation = Animated.parallel([
      Animated.spring(pop, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(progress, { toValue: 1, duration: CONFETTI_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [achievement, reducedMotion, progress, pop]);

  return (
    <Modal
      visible={achievement !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Kutlamayı kapat" accessibilityRole="button">
        {!reducedMotion
          ? pieces.map((piece) => (
              <Animated.View
                key={piece.key}
                pointerEvents="none"
                style={[
                  styles.piece,
                  {
                    left: piece.left,
                    width: piece.size,
                    height: piece.size * 1.6,
                    backgroundColor: piece.color,
                    opacity: progress.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
                    transform: [
                      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-40, 520] }) },
                      { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.drift] }) },
                      {
                        rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${piece.rotate}deg`] }),
                      },
                    ],
                  },
                ]}
              />
            ))
          : null}

        {achievement ? (
          <Animated.View
            testID="achievement-celebration"
            accessibilityViewIsModal
            accessibilityLiveRegion="polite"
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
              { transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }], opacity: pop },
            ]}
          >
            {/* Kartin icine dokunmak modali kapatmasin. */}
            <Pressable onPress={() => undefined} style={styles.cardInner} accessible={false}>
              <View style={[styles.iconWrap, { backgroundColor: colors.cardActive, borderColor: colors.borderActive }]}>
                <AchievementBadgeIcon icon={achievement.icon} size={40} color={colors.primary} />
              </View>
              <Text style={[styles.kicker, { color: colors.primary }]}>YENİ ROZET</Text>
              <Text style={[styles.title, { color: colors.text }]}>{achievement.title}</Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                Tebrikler! {achievement.description ? achievement.description : "Bu rozeti kazandın."}
              </Text>
              {achievement.points > 0 ? (
                <Text style={[styles.points, { color: colors.text }]}>+{achievement.points} MB FIT puanı</Text>
              ) : null}
              <Pressable
                testID="achievement-celebration-close"
                onPress={onClose}
                accessibilityRole="button"
                style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.buttonLabel}>Harika!</Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        ) : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    overflow: "hidden",
  },
  piece: { position: "absolute", top: 0, borderRadius: 2 },
  card: { width: "100%", maxWidth: 340, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth },
  cardInner: { alignItems: "center", padding: 24 },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  title: { fontSize: 20, fontWeight: "800", marginTop: 4, textAlign: "center" },
  message: { fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: "center" },
  points: { fontSize: 13, fontWeight: "700", marginTop: 10 },
  button: { marginTop: 20, alignSelf: "stretch", minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  buttonLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
