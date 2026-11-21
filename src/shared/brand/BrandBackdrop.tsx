import { memo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, Pattern, RadialGradient, Rect, Stop } from "react-native-svg";

const DOT_GAP = 22;

/**
 * Acilis ekraninin zemini: cok ince bir nokta izgarasi ve logonun arkasinda belli belirsiz bir mavi isik.
 * Statiktir (animasyon yok); izgara kenarlara dogru soner ki dikkat ortadaki logoda kalsin.
 */
export const BrandBackdrop = memo(function BrandBackdrop() {
  const { width, height } = useWindowDimensions();
  const cx = width / 2;
  const cy = height / 2;
  const glowRadius = Math.max(width, 360) * 0.7;
  const fadeRadius = Math.max(width, height) * 0.62;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          <Pattern id="mbfit-dots" width={DOT_GAP} height={DOT_GAP} patternUnits="userSpaceOnUse">
            <Circle cx={DOT_GAP / 2} cy={DOT_GAP / 2} r={0.9} fill="#FFFFFF" fillOpacity={0.07} />
          </Pattern>
          <RadialGradient id="mbfit-glow" cx={cx} cy={cy} r={glowRadius} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#2563EB" stopOpacity={0.16} />
            <Stop offset="0.5" stopColor="#2563EB" stopOpacity={0.04} />
            <Stop offset="1" stopColor="#2563EB" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="mbfit-vignette" cx={cx} cy={cy} r={fadeRadius} gradientUnits="userSpaceOnUse">
            <Stop offset="0.35" stopColor="#050507" stopOpacity={0} />
            <Stop offset="1" stopColor="#050507" stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#mbfit-dots)" />
        <Rect width={width} height={height} fill="url(#mbfit-vignette)" />
        <Circle cx={cx} cy={cy} r={glowRadius} fill="url(#mbfit-glow)" />
      </Svg>
    </View>
  );
});
