import { useState } from "react";
import {
    LayoutChangeEvent,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Svg, {
    Circle,
    Defs,
    Line,
    LinearGradient,
    Path,
    Stop,
} from "react-native-svg";

import { colors } from "../theme";
import { WeightPoint } from "../types";

type Props = {
  data: WeightPoint[];
};

const CHART_HEIGHT = 170;
const TOP_PADDING = 18;
const BOTTOM_PADDING = 18;
const HIT_SIZE = 28;

export function WeightChart({ data }: Props) {
  const [width, setWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const weights = data.map((point) => point.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const plotHeight = CHART_HEIGHT - TOP_PADDING - BOTTOM_PADDING;

  const points = data.map((point, index) => {
    const x = data.length > 1 ? (index / (data.length - 1)) * width : width / 2;
    const y =
      TOP_PADDING + plotHeight - ((point.weight - min) / range) * plotHeight;
    return { x, y, ...point };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`
      : "";

  const selected = selectedIndex !== null ? points[selectedIndex] : null;
  const labelIndices =
    points.length <= 3
      ? points.map((_, index) => index)
      : [0, Math.round((points.length - 1) / 2), points.length - 1];

  return (
    <View>
      <Text style={styles.sectionTitle}>Kilo İlerlemesi</Text>

      <View style={styles.card}>
        <View style={styles.chartArea} onLayout={onLayout}>
          {width > 0 ? (
            <Svg width={width} height={CHART_HEIGHT}>
              <Defs>
                <LinearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop
                    offset="0"
                    stopColor={colors.electricBlue}
                    stopOpacity={0.22}
                  />
                  <Stop
                    offset="1"
                    stopColor={colors.electricBlue}
                    stopOpacity={0}
                  />
                </LinearGradient>
              </Defs>

              {areaPath ? <Path d={areaPath} fill="url(#weightFill)" /> : null}

              {points.length > 1 ? (
                <Path
                  d={linePath}
                  stroke={colors.electricBlue}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ) : null}

              {selected ? (
                <>
                  <Line
                    x1={selected.x}
                    y1={selected.y}
                    x2={selected.x}
                    y2={CHART_HEIGHT}
                    stroke={colors.electricBlue}
                    strokeWidth={1}
                    strokeOpacity={0.25}
                  />
                  <Circle
                    cx={selected.x}
                    cy={selected.y}
                    r={4.5}
                    fill={colors.background}
                    stroke={colors.electricBlue}
                    strokeWidth={2}
                  />
                </>
              ) : null}
            </Svg>
          ) : null}

          {/* Dokunma alanları - noktaların üzerine görünmez Pressable'lar */}
          {points.map((point, index) => (
            <Pressable
              key={`${point.date}-${index}`}
              onPress={() =>
                setSelectedIndex((prev) => (prev === index ? null : index))
              }
              hitSlop={4}
              style={[
                styles.hitArea,
                { left: point.x - HIT_SIZE / 2, top: point.y - HIT_SIZE / 2 },
              ]}
            />
          ))}

          {selected ? (
            <View
              pointerEvents="none"
              style={[
                styles.tooltip,
                {
                  left: Math.min(
                    Math.max(selected.x - 40, 0),
                    Math.max(width - 80, 0),
                  ),
                  top: Math.max(selected.y - 46, 0),
                },
              ]}
            >
              <Text style={styles.tooltipValue}>{selected.weight} kg</Text>
              <Text style={styles.tooltipDate}>{selected.date}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.labelsRow}>
          {labelIndices.map((index) => (
            <Text key={index} style={styles.axisLabel}>
              {points[index]?.date.slice(0, 3)}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chartArea: { height: CHART_HEIGHT, width: "100%" },
  hitArea: { position: "absolute", width: HIT_SIZE, height: HIT_SIZE },
  tooltip: {
    position: "absolute",
    width: 80,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#15181E",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tooltipValue: { color: colors.textPrimary, fontSize: 12, fontWeight: "700" },
  tooltipDate: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  axisLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "600" },
});
