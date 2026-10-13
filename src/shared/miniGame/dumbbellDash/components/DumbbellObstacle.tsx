import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { BAR_INSET, GROUND_Y, OBSTACLE_W, PLATE_H } from "../engine";

type Props = {
  /** Dunya biriminden piksele carpan. */
  scale: number;
  gapTop: number;
  gapBottom: number;
};

/**
 * Bir engel cifti: ustten ve alttan uzanan dambil sapi, bosluga bakan ucunda iki plakali dambil basi.
 * Boyutlar motordaki carpisma kutulariyla ayni (sap: BAR_INSET kadar ince, plaka: tam genislik).
 * Yatay konum ust bilesendeki Animated.View'in translateX'i ile verilir; bu bilesen yalnizca engel
 * degistiginde (yaklasik iki saniyede bir) yeniden render edilir.
 */
export const DumbbellObstacle = memo(function DumbbellObstacle({ scale, gapTop, gapBottom }: Props) {
  const width = OBSTACLE_W * scale;
  const barLeft = BAR_INSET * scale;
  const barWidth = (OBSTACLE_W - BAR_INSET * 2) * scale;
  const plateHeight = PLATE_H * scale;
  const topPlateTop = (gapTop - PLATE_H) * scale;
  const bottomPlateTop = gapBottom * scale;
  const groundPx = GROUND_Y * scale;

  return (
    <View style={[styles.column, { width, height: groundPx }]} pointerEvents="none">
      <View style={[styles.bar, { left: barLeft, width: barWidth, top: 0, height: Math.max(0, topPlateTop) }]} />
      <Plate top={topPlateTop} width={width} height={plateHeight} />
      <Plate top={bottomPlateTop} width={width} height={plateHeight} />
      <View
        style={[
          styles.bar,
          { left: barLeft, width: barWidth, top: bottomPlateTop + plateHeight, height: Math.max(0, groundPx - bottomPlateTop - plateHeight) },
        ]}
      />
    </View>
  );
});

function Plate({ top, width, height }: { top: number; width: number; height: number }) {
  return (
    <View style={[styles.plate, { top, width, height, borderRadius: Math.min(6, height / 3) }]}>
      <View style={[styles.plateGroove, { top: height / 2 - 1 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  column: { position: "absolute", top: 0, left: 0 },
  bar: { position: "absolute", backgroundColor: "#3A3F48", borderRadius: 3 },
  plate: {
    position: "absolute",
    left: 0,
    backgroundColor: "#E6E8EB",
    borderWidth: 1,
    borderColor: "#B9BEC6",
    overflow: "hidden",
  },
  plateGroove: { position: "absolute", left: 0, right: 0, height: 2, backgroundColor: "#9BA1AA" },
});
