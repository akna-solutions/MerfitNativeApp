import { memo } from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type Props = {
  size: number;
};

/** Alin bandi: koyu gri (oyun paleti siyah / koyu gri / beyaz). */
const HEADBAND = "#3A3F48";

/**
 * "Kettle": Dumbbell Dash'in ozgun maskotu - alin bandi takmis, sevimli bir kettlebell. Tamamen vektorel
 * ve statiktir; hareket/rotasyon ust bilesendeki Animated.View ile verilir (her karede yeniden cizilmez).
 */
export const Mascot = memo(function Mascot({ size }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M31 46 C29 12, 71 12, 69 46" stroke="#E9EBEF" strokeWidth={11} strokeLinecap="round" fill="none" />
      <Path d="M31 46 C29 12, 71 12, 69 46" stroke="#0E1014" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.25} />
      <Circle cx={50} cy={63} r={31} fill="#F4F5F7" />
      <Rect x={21} y={45} width={58} height={9} rx={4.5} fill={HEADBAND} />
      <Path d="M74 47 L86 41 L83 51 Z" fill={HEADBAND} />
      <Circle cx={40} cy={65} r={5.2} fill="#0B0D12" />
      <Circle cx={60} cy={65} r={5.2} fill="#0B0D12" />
      <Circle cx={41.6} cy={63.4} r={1.7} fill="#FFFFFF" />
      <Circle cx={61.6} cy={63.4} r={1.7} fill="#FFFFFF" />
      <Path d="M43 76 Q50 82 57 76" stroke="#0B0D12" strokeWidth={3.2} strokeLinecap="round" fill="none" />
      <Rect x={33} y={90} width={34} height={5} rx={2.5} fill="#C9CDD4" />
    </Svg>
  );
});
