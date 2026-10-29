import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { RevealOrigin, revealRadius } from "./revealRadius";

export type { RevealOrigin };

/** Dairenin baslangic capi; yuvarlak butonun capiyla ayni olmalidir. */
export const REVEAL_BASE_SIZE = 64;
export const REVEAL_GROW_MS = 380;
const FADE_DELAY_MS = 140;
const FADE_MS = 240;
/** Yukleme gostergesi en az bu kadar gorunur; aninda kaybolup "goz kirpma" gibi durmasin. */
export const LOADER_MIN_MS = 700;
/** Hedef hic hazir olmasa bile ekran bu sureden sonra acilir; ortu dokunmalari sonsuza dek kilitlemesin. */
export const LOADER_MAX_MS = 4000;
const SPIN_MS = 1100;

type Props = {
  /** Dairenin buyumeye basladigi nokta (pencere koordinatlari); null ise gosterilmez. */
  origin: RevealOrigin | null;
  color: string;
  /** Daire ekrani kapladiginda cagrilir; hedef ekrana gecis burada yapilir. */
  onCovered: () => void;
  /** Daire solup bittiginde cagrilir. */
  onDone: () => void;
  /**
   * Verilirse ekran kaplandiktan sonra ortada bu ikon doner, altinda baslik ve kisa aciklama yazar;
   * `ready` olana kadar (en az LOADER_MIN_MS, en fazla LOADER_MAX_MS) ortu kalkmaz.
   */
  loader?: RevealLoader;
  /** Hedef ekranin verisi hazir mi; yalnizca `loader` ile anlamlidir. */
  ready?: boolean;
};

export type RevealLoader = { icon: keyof typeof Ionicons.glyphMap; title: string; description: string };

type Phase = "idle" | "growing" | "holding" | "fading";

/** Yuvarlak navbar butonundan baslayip ekrani kaplayan, sonra solarak yeni ekrani gosteren daire. */
export function CircleReveal({ origin, color, onCovered, onDone, loader, ready = true }: Props) {
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const spin = useSharedValue(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const coveredAtRef = useRef(0);
  const coveredRef = useRef(onCovered);
  const doneRef = useRef(onDone);
  coveredRef.current = onCovered;
  doneRef.current = onDone;
  const withLoader = Boolean(loader);
  const withLoaderRef = useRef(withLoader);
  withLoaderRef.current = withLoader;

  const startFade = useCallback(() => {
    setPhase("fading");
    const done = () => {
      setPhase("idle");
      doneRef.current();
    };
    opacity.set(
      withDelay(
        FADE_DELAY_MS,
        withTiming(0, { duration: FADE_MS }, (finished) => {
          if (finished) scheduleOnRN(done);
        }),
      ),
    );
  }, [opacity]);

  const handleCovered = useCallback(() => {
    coveredRef.current();
    if (!withLoaderRef.current) {
      startFade();
      return;
    }
    coveredAtRef.current = Date.now();
    setPhase("holding");
  }, [startFade]);

  useEffect(() => {
    if (!origin) return;
    const endScale = (revealRadius(origin, width, height) * 2) / REVEAL_BASE_SIZE + 0.2;
    setPhase("growing");
    scale.set(1);
    opacity.set(1);
    scale.set(
      withTiming(endScale, { duration: REVEAL_GROW_MS, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) scheduleOnRN(handleCovered);
      }),
    );
    // Boyut degisimi (dondurme) yeni bir animasyon baslatmasin; yalnizca yeni bir baslangic noktasi baslatir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin]);

  // Kapli bekleme: hedef hazir olunca (en az LOADER_MIN_MS sonra) ya da en gec LOADER_MAX_MS'de ortu kalkar.
  useEffect(() => {
    if (phase !== "holding") return;
    const elapsed = Date.now() - coveredAtRef.current;
    const wait = ready ? Math.max(0, LOADER_MIN_MS - elapsed) : Math.max(0, LOADER_MAX_MS - elapsed);
    const timer = setTimeout(startFade, wait);
    return () => clearTimeout(timer);
  }, [phase, ready, startFade]);

  const showLoader = withLoader && (phase === "holding" || phase === "fading");
  useEffect(() => {
    if (!showLoader) return;
    spin.set(0);
    spin.set(withRepeat(withTiming(1, { duration: SPIN_MS, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(spin);
  }, [showLoader, spin]);

  const circleStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: scale.get() }],
  }));
  const loaderStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.get() * 360}deg` }] }));

  if (!origin) return null;

  return (
    <>
      <Animated.View
        testID="circle-reveal"
        pointerEvents="auto"
        style={[
          styles.circle,
          { backgroundColor: color, left: origin.x - REVEAL_BASE_SIZE / 2, top: origin.y - REVEAL_BASE_SIZE / 2 },
          circleStyle,
        ]}
      />
      {showLoader ? (
        <Animated.View testID="circle-reveal-loader" pointerEvents="none" style={[StyleSheet.absoluteFill, styles.loader, loaderStyle]}>
          <View style={styles.loaderBody} accessibilityRole="progressbar" accessibilityLabel={`${loader!.title} yükleniyor`}>
            <Animated.View style={spinStyle}>
              <Ionicons name={loader!.icon} size={56} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.loaderTitle}>{loader!.title}</Text>
            <Text style={styles.loaderDescription}>{loader!.description}</Text>
          </View>
        </Animated.View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  circle: {
    position: "absolute",
    width: REVEAL_BASE_SIZE,
    height: REVEAL_BASE_SIZE,
    borderRadius: REVEAL_BASE_SIZE / 2,
  },
  loader: { alignItems: "center", justifyContent: "center" },
  loaderBody: { alignItems: "center", paddingHorizontal: 40 },
  loaderTitle: { color: "#FFFFFF", fontSize: 26, fontWeight: "800", marginTop: 18, letterSpacing: 0.3 },
  loaderDescription: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "500", marginTop: 6, textAlign: "center" },
});
