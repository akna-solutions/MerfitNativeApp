import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useTheme } from "../theme/ThemeContext";
import { DayRingValues } from "./dayRings";
import { RING_COLORS } from "./ringColors";

type Props = {
  values: DayRingValues;
  size: number;
  /** Halka kalinligi; varsayilan boyuta gore. */
  strokeWidth?: number;
  testID?: string;
};

/**
 * Ic ice uc halka: dis = antrenman, orta = aktivite (harcanan), ic = beslenme (alinan kalori).
 * Degeri null olan halka (veri yok) cizilmez; iz (track) yalnizca en az bir halka varken gosterilir.
 */
export function ActivityRings({ values, size, strokeWidth, testID }: Props) {
  const { colors } = useTheme();
  const stroke = strokeWidth ?? Math.max(2, Math.round(size / 11));
  const gap = Math.max(1, Math.round(stroke / 3));
  const rings = [
    { key: "workout", value: values.workout, color: colors.primary },
    { key: "activity", value: values.activity, color: RING_COLORS.activity },
    { key: "nutrition", value: values.nutrition, color: RING_COLORS.nutrition },
  ] as const;
  const hasAny = rings.some((ring) => ring.value !== null);

  return (
    <View testID={testID} style={{ width: size, height: size }}>
      {hasAny ? (
        <Svg width={size} height={size}>
          {rings.map((ring, index) => {
            const radius = size / 2 - stroke / 2 - index * (stroke + gap);
            if (radius <= stroke / 2) return null;
            const circumference = 2 * Math.PI * radius;
            return (
              <RingLayer key={ring.key} radius={radius} circumference={circumference} size={size} stroke={stroke}
                value={ring.value} color={ring.color} track={colors.progressTrack} testID={testID ? `${testID}-${ring.key}` : undefined} />
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

function RingLayer({
  radius, circumference, size, stroke, value, color, track, testID,
}: {
  radius: number; circumference: number; size: number; stroke: number; value: number | null; color: string; track: string; testID?: string;
}) {
  const center = size / 2;
  return (
    <>
      <Circle cx={center} cy={center} r={radius} stroke={track} strokeWidth={stroke} fill="none" />
      {value !== null && value > 0 ? (
        <Circle
          testID={testID}
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - value)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      ) : null}
    </>
  );
}
