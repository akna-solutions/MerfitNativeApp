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
import { BrandWordmark } from "../brand/BrandMark";
import { BRAND_BLUE } from "../brand/brandMark";

export type { RevealOrigin };

/** Dairenin varsayilan baslangic capi; `baseSize` ile yuvarlak butonun capina esitlenir. */
export const REVEAL_BASE_SIZE = 48;
export const REVEAL_GROW_MS = 380;
const FADE_DELAY_MS = 140;
const FADE_MS = 240;
/** Yukleme gostergesi en az bu kadar gorunur; aninda kaybolup "goz kirpma" gibi durmasin. */
export const LOADER_MIN_MS = 700;
/** Hedef hic hazir olmasa bile ekran bu sureden sonra acilir; ortu dokunmalari sonsuza dek kilitlemesin. */
export const LOADER_MAX_MS = 4000;
const PROGRESS_MS = 1100;
const PROGRESS_TRACK = 120;
const PROGRESS_BAR = 44;

type Props = {
  /** Dairenin buyumeye basladigi nokta (pencere koordinatlari); null ise gosterilmez. */
  origin: RevealOrigin | null;
  color: string;
  /** Daire ekrani kapladiginda cagrilir; hedef ekrana gecis burada yapilir. */
  onCovered: () => void;
  /** Daire solup bittiginde cagrilir. */
  onDone: () => void;
  /**
   * Verilirse ekran kaplandiktan sonra ortada hedef bolumun yazi logosu ("MB | FIT" ya da "MB | SHOP"),
   * altinda kisa aciklama ve ince bir yukleniyor cizgisi gorunur;
   * `ready` olana kadar (en az LOADER_MIN_MS, en fazla LOADER_MAX_MS) ortu kalkmaz.
   */
  loader?: RevealLoader;
  /** Hedef ekranin verisi hazir mi; yalnizca `loader` ile anlamlidir. */
  ready?: boolean;
  /** Dairenin baslangic capi; daireyi baslatan yuvarlak butonun capiyla ayni olmalidir. */
  baseSize?: number;
};

export type RevealLoader = {
  /** Gosterilecek yazi logosu. */
  brand: "fit" | "shop";
  /** Erisilebilirlik etiketi icin bolum adi (orn. "MB Shop"). */
  title: string;
  description: string;
};

type Phase = "idle" | "growing" | "holding" | "fading";

/** Yuvarlak navbar butonundan baslayip ekrani kaplayan, sonra solarak yeni ekrani gosteren daire. */
export function CircleReveal({ origin, color, onCovered, onDone, loader, ready = true, baseSize = REVEAL_BASE_SIZE }: Props) {
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const progress = useSharedValue(0);
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
    const endScale = (revealRadius(origin, width, height) * 2) / baseSize + 0.2;
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
    progress.set(0);
    progress.set(withRepeat(withTiming(1, { duration: PROGRESS_MS, easing: Easing.inOut(Easing.cubic) }), -1, false));
    return () => cancelAnimation(progress);
  }, [showLoader, progress]);

  const circleStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: scale.get() }],
  }));
  const loaderStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -PROGRESS_BAR + progress.get() * (PROGRESS_TRACK + PROGRESS_BAR) }],
  }));

  if (!origin) return null;

  return (
    <>
      <Animated.View
        testID="circle-reveal"
        pointerEvents="auto"
        style={[
          styles.circle,
          { backgroundColor: color, width: baseSize, height: baseSize, borderRadius: baseSize / 2, left: origin.x - baseSize / 2, top: origin.y - baseSize / 2 },
          circleStyle,
        ]}
      />
      {showLoader ? (
        <Animated.View testID="circle-reveal-loader" pointerEvents="none" style={[StyleSheet.absoluteFill, styles.loader, loaderStyle]}>
          <View style={styles.loaderBody} accessibilityRole="progressbar" accessibilityLabel={`${loader!.title} yükleniyor`}>
            <BrandWordmark variant={loader!.brand} width={loader!.brand === "shop" ? 200 : 168} />
            <Text style={styles.loaderDescription}>{loader!.description}</Text>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressBar, progressStyle]} />
            </View>
          </View>
        </Animated.View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  circle: {
    position: "absolute",
  },
  loader: { alignItems: "center", justifyContent: "center" },
  loaderBody: { alignItems: "center", paddingHorizontal: 40 },
  loaderDescription: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
    marginTop: 18,
    textAlign: "center",
  },
  progressTrack: {
    width: PROGRESS_TRACK,
    height: 2,
    borderRadius: 1,
    marginTop: 28,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  progressBar: { width: PROGRESS_BAR, height: 2, borderRadius: 1, backgroundColor: BRAND_BLUE },
});
