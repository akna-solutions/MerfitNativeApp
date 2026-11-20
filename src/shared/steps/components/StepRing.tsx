import { ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import { useReducedMotion } from "../../motion/useReducedMotion";
import { useTheme } from "../../theme/ThemeContext";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** 0..1 (hedef asilsa da halka tam dolu kalir). */
  ratio: number;
  size: number;
  stroke: number;
  children?: ReactNode;
  testID?: string;
};

/**
 * Gunluk adim hedefinin dairesel ilerleme halkasi (mavi gecisli). Deger degisince yumusakca dolar; "Hareketi
 * azalt" acikken animasyonsuz gosterilir.
 */
export function StepRing({ ratio, size, stroke, children, testID }: Props) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, ratio));
  const progress = useRef(new Animated.Value(reducedMotion ? clamped : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(clamped);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: clamped,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [clamped, progress, reducedMotion]);

  const dashOffset = progress.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  return (
    <View style={{ width: size, height: size }} testID={testID}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="stepRingGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#00A8FF" />
            <Stop offset="1" stopColor={colors.primary} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.progressTrack} strokeWidth={stroke} fill="none" />
        {clamped > 0 ? (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#stepRingGradient)"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
});
