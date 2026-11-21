import { memo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { BrandPattern } from "./BrandPattern";
import { BRAND_BLACK } from "./brandMark";

/**
 * Marka ekranlarinin (acilis, MB Shop / MB Fit gecisi) zemini: cok soluk ikon deseni, desenin kenarlarda
 * sonmesi icin hafif bir vinyet ve ortada belli belirsiz bir mavi isik. Statiktir.
 */
export const BrandBackdrop = memo(function BrandBackdrop({ variant = "fit" }: { variant?: "fit" | "shop" }) {
  const { width, height } = useWindowDimensions();
  const cx = width / 2;
  const cy = height / 2;
  const glowRadius = Math.max(width, 360) * 0.62;
  const fadeRadius = Math.max(width, height) * 0.75;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <BrandPattern variant={variant} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="mbfit-glow" cx={cx} cy={cy} r={glowRadius} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#2563EB" stopOpacity={0.1} />
            <Stop offset="1" stopColor="#2563EB" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="mbfit-vignette" cx={cx} cy={cy} r={fadeRadius} gradientUnits="userSpaceOnUse">
            <Stop offset="0.55" stopColor={BRAND_BLACK} stopOpacity={0} />
            <Stop offset="1" stopColor={BRAND_BLACK} stopOpacity={0.85} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#mbfit-vignette)" />
        <Circle cx={cx} cy={cy} r={glowRadius} fill="url(#mbfit-glow)" />
      </Svg>
    </View>
  );
});
