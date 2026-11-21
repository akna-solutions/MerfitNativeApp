import { useEffect, useRef } from "react";
import { Animated, Easing, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { BrandMonogram } from "./BrandMark";
import { BRAND_BLUE } from "./brandMark";
import { useReducedMotion } from "../motion/useReducedMotion";

type Props = {
  /** Monogramin rengi; acik temada koyu, koyu temada beyaz olmali. */
  markColor?: string;
  /** Halkanin cap (dp). */
  size?: number;
  /** Donen yayin rengi; logonun kendisi her zaman marka mavisindedir. */
  color?: string;
  /** Halkanin altinda gosterilecek kisa mesaj (orn. "Programın yükleniyor"). */
  label?: string;
  labelColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const STROKE = 2.5;

/**
 * Tam ekran bekleme durumlarinda kullanilan markali yukleniyor gostergesi: ince bir halka uzerinde donen
 * mavi yay ve ortada hafifce nefes alan "MB" monogrami. "Hareketi azalt" acikken yay yavas doner, logo sabit kalir.
 */
export function BrandLoader({ size = 52, color = BRAND_BLUE, markColor, label, labelColor, style, testID }: Props) {
  const reducedMotion = useReducedMotion();
  const spin = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: reducedMotion ? 2400 : 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spinLoop.start();
    if (reducedMotion) return () => spinLoop.stop();
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    breatheLoop.start();
    return () => {
      spinLoop.stop();
      breatheLoop.stop();
    };
  }, [reducedMotion, spin, breathe]);

  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? "Yükleniyor"}
      style={[styles.wrap, style]}
    >
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeOpacity={0.14} strokeWidth={STROKE} fill="none" />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.28} ${circumference}`}
              fill="none"
            />
          </Svg>
        </Animated.View>
        <Animated.View
          style={[
            styles.markCenter,
            {
              opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }),
              transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
            },
          ]}
        >
          <BrandMonogram width={size * 0.42} color={markColor} />
        </Animated.View>
      </View>
      {label ? <Text style={[styles.label, labelColor ? { color: labelColor } : null]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", alignSelf: "center" },
  markCenter: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  label: { marginTop: 14, fontSize: 13, fontWeight: "500", color: "rgba(127,127,127,1)", textAlign: "center" },
});
