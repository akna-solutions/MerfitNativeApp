import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { BrandBackdrop } from "./BrandBackdrop";
import { BrandWordmark } from "./BrandMark";
import { aspectOf, BRAND_BLACK, BRAND_BLUE, NATIVE_SPLASH_WORDMARK_WIDTH, WORDMARK } from "./brandMark";
import { useReducedMotion } from "../motion/useReducedMotion";

export const SPLASH_TAGLINE = "Daha akıllı antrenman. Daha iyi yaşam.";
export const SPLASH_BADGE = "Antrenman · Beslenme · İlerleme";

/** Logonun yerlestigi son genislik (dp). */
const LOGO_WIDTH = 168;
/** Acilis ekraninin en az gorunme suresi; marka animasyonu yarida kesilmesin. */
const MIN_VISIBLE_MS = 1500;
/** Hazir olunmadiysa bu sureden sonra ince bir yukleniyor cizgisi belirir. */
const SHOW_PROGRESS_AFTER_MS = 2000;
/** Uygulama hic hazir olmasa bile acilis ekrani bu sureden sonra kalkar (kilitlenmeyi onler). */
const FAILSAFE_MS = 8000;

type Props = {
  /** Uygulama ilk ekrani gostermeye hazir mi (orn. kayitli oturum okundu mu). */
  ready: boolean;
  /** Cikis animasyonu bittiginde cagrilir; ust bilesen acilis ekranini kaldirir. */
  onFinish: () => void;
};

/**
 * Native acilis ekraninin devami olan JS acilis ekrani. Native ekranla ayni zemin rengi ve ayni boyutta
 * yazi logosuyla baslar (gecis fark edilmez), ardindan logo yerine oturur; ustte slogan, altta rozet sirayla
 * belirir. Uygulama hazir olunca yumusak bir solma ile kalkar.
 */
export function BrandSplash({ ready, onFinish }: Props) {
  const reducedMotion = useReducedMotion();
  const { height } = useWindowDimensions();

  const [minElapsed, setMinElapsed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const exiting = useRef(false);

  const markScale = useRef(new Animated.Value(1)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const badge = useRef(new Animated.Value(0)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const progressSlide = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;

  const hideNativeSplash = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {
      // Native acilis ekrani zaten kapanmissa (orn. web, hizli yeniden yukleme) yok sayilir.
    });
  }, []);

  // Giris animasyonu.
  useEffect(() => {
    const settledScale = LOGO_WIDTH / NATIVE_SPLASH_WORDMARK_WIDTH;
    if (reducedMotion) {
      markScale.setValue(settledScale);
      [backdrop, tagline, badge].forEach((v) => v.setValue(1));
      return;
    }
    const ease = Easing.bezier(0.22, 1, 0.36, 1);
    const fade = (v: Animated.Value, duration = 520) =>
      Animated.timing(v, { toValue: 1, duration, easing: ease, useNativeDriver: true });
    const intro = Animated.parallel([
      Animated.timing(markScale, { toValue: settledScale, duration: 760, easing: ease, useNativeDriver: true }),
      fade(backdrop, 900),
      Animated.sequence([Animated.delay(180), Animated.stagger(140, [fade(tagline), fade(badge)])]),
    ]);
    intro.start();
    return () => intro.stop();
  }, [reducedMotion, markScale, backdrop, tagline, badge]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setMinElapsed(true), reducedMotion ? 400 : MIN_VISIBLE_MS),
      setTimeout(() => setShowProgress(true), SHOW_PROGRESS_AFTER_MS),
      setTimeout(() => setTimedOut(true), FAILSAFE_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reducedMotion]);

  // Uzun bekleyiste ince, sonsuz kayan yukleniyor cizgisi.
  useEffect(() => {
    if (!showProgress || ready) return;
    Animated.timing(progressOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.timing(progressSlide, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [showProgress, ready, reducedMotion, progressOpacity, progressSlide]);

  // Cikis.
  useEffect(() => {
    if (exiting.current) return;
    if (!timedOut && !(ready && minElapsed)) return;
    exiting.current = true;
    Animated.timing(exit, {
      toValue: 1,
      duration: reducedMotion ? 160 : 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onFinish());
  }, [ready, minElapsed, timedOut, reducedMotion, exit, onFinish]);

  const markHeight = LOGO_WIDTH * aspectOf(WORDMARK);
  const center = height / 2;
  const rise = (v: Animated.Value, distance: number) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
  });

  return (
    <Animated.View
      testID="brand-splash"
      accessibilityLabel="MB Fit açılıyor"
      onLayout={hideNativeSplash}
      style={[styles.root, { opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdrop }]}>
        <BrandBackdrop />
      </Animated.View>

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }] },
        ]}
      >
        <Animated.Text
          style={[styles.tagline, { bottom: height - center + markHeight / 2 + 30 }, rise(tagline, 8)]}
        >
          {SPLASH_TAGLINE}
        </Animated.Text>

        <View style={styles.markCenter} pointerEvents="none">
          <Animated.View style={{ transform: [{ scale: markScale }] }}>
            <BrandWordmark width={NATIVE_SPLASH_WORDMARK_WIDTH} />
          </Animated.View>
        </View>

        <View style={[styles.below, { top: center + markHeight / 2 + 30 }]}>
          <Animated.View style={[styles.badge, rise(badge, -6)]}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>{SPLASH_BADGE}</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.progressTrack, { opacity: progressOpacity }]} testID="brand-splash-progress">
          <Animated.View
            style={[
              styles.progressBar,
              {
                transform: [
                  { translateX: progressSlide.interpolate({ inputRange: [0, 1], outputRange: [-44, 120] }) },
                ],
              },
            ]}
          />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: BRAND_BLACK, zIndex: 1000, elevation: 1000 },
  markCenter: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  tagline: {
    position: "absolute",
    left: 24,
    right: 24,
    textAlign: "center",
    color: "rgba(255,255,255,0.88)",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  below: { position: "absolute", left: 24, right: 24, alignItems: "center" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: BRAND_BLUE, marginRight: 8 },
  badgeText: { color: "rgba(255,255,255,0.82)", fontSize: 12.5, fontWeight: "600", letterSpacing: 0.3 },
  progressTrack: {
    position: "absolute",
    bottom: 72,
    alignSelf: "center",
    width: 120,
    height: 2,
    borderRadius: 1,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  progressBar: { width: 44, height: 2, borderRadius: 1, backgroundColor: BRAND_BLUE },
});
