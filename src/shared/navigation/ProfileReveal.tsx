import { useEffect, useRef } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { RevealOrigin, revealRadius } from "./revealRadius";

export type { RevealOrigin };

/** Dairenin baslangic capi; profil butonunun capiyla ayni olmalidir. */
export const REVEAL_BASE_SIZE = 64;
export const REVEAL_GROW_MS = 380;
const FADE_DELAY_MS = 140;
const FADE_MS = 240;

type Props = {
  /** Dairenin buyumeye basladigi nokta (pencere koordinatlari); null ise gosterilmez. */
  origin: RevealOrigin | null;
  color: string;
  /** Daire ekrani kapladiginda cagrilir; hedef ekrana gecis burada yapilir. */
  onCovered: () => void;
  /** Daire solup bittiginde cagrilir. */
  onDone: () => void;
};

/** Profil butonundan baslayip ekrani kaplayan, sonra solarak yeni ekrani gosteren daire. */
export function ProfileReveal({ origin, color, onCovered, onDone }: Props) {
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const coveredRef = useRef(onCovered);
  const doneRef = useRef(onDone);
  coveredRef.current = onCovered;
  doneRef.current = onDone;

  useEffect(() => {
    if (!origin) return;
    const endScale = (revealRadius(origin, width, height) * 2) / REVEAL_BASE_SIZE + 0.2;
    const covered = () => coveredRef.current();
    const done = () => doneRef.current();
    scale.set(1);
    opacity.set(1);
    scale.set(
      withTiming(endScale, { duration: REVEAL_GROW_MS, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (!finished) return;
        scheduleOnRN(covered);
        opacity.set(
          withDelay(
            FADE_DELAY_MS,
            withTiming(0, { duration: FADE_MS }, (fadeFinished) => {
              if (fadeFinished) scheduleOnRN(done);
            }),
          ),
        );
      }),
    );
  }, [origin, width, height, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: scale.get() }],
  }));

  if (!origin) return null;

  return (
    <Animated.View
      testID="profile-reveal"
      pointerEvents="auto"
      style={[
        styles.circle,
        { backgroundColor: color, left: origin.x - REVEAL_BASE_SIZE / 2, top: origin.y - REVEAL_BASE_SIZE / 2 },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    position: "absolute",
    width: REVEAL_BASE_SIZE,
    height: REVEAL_BASE_SIZE,
    borderRadius: REVEAL_BASE_SIZE / 2,
  },
});
