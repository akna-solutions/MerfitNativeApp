import { useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { ScoreHistoryPoint } from "../types";

type Props = {
  points: number;
  weeklyChange: number;
  history: ScoreHistoryPoint[];
};

const CHART_HEIGHT = 120;
const PADDING = 12;

export function ScoreChart({ points, weeklyChange, history }: Props) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  const values = history.map((point) => point.points);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const plotHeight = CHART_HEIGHT - PADDING * 2;

  const coords = history.map((point, index) => ({
    x: history.length > 1 ? (index / (history.length - 1)) * width : width / 2,
    y: PADDING + plotHeight - ((point.points - min) / range) * plotHeight,
  }));

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${CHART_HEIGHT} L ${coords[0].x} ${CHART_HEIGHT} Z`
      : "";

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Puan İlerlemesi</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.points, { color: colors.text }]}>{points.toLocaleString()}</Text>
        <Text style={[styles.change, { color: colors.primary }]}>+{weeklyChange} bu hafta</Text>

        <View style={styles.chartArea} onLayout={onLayout}>
          {width > 0 ? (
            <Svg width={width} height={CHART_HEIGHT}>
              <Defs>
                <LinearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop
                    offset="0"
                    stopColor={colors.primary}
                    stopOpacity={0.2}
                  />
                  <Stop
                    offset="1"
                    stopColor={colors.primary}
                    stopOpacity={0}
                  />
                </LinearGradient>
              </Defs>
              {areaPath ? <Path d={areaPath} fill="url(#scoreFill)" /> : null}
              {coords.length > 1 ? (
                <Path
                  d={linePath}
                  stroke={colors.primary}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ) : null}
            </Svg>
          ) : null}
        </View>

        <View style={styles.labelsRow}>
          {history.map((point) => (
            <Text key={point.label} style={[styles.axisLabel, { color: colors.textSecondary }]}>
              {point.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  points: { fontSize: 22, fontWeight: "700" },
  change: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  chartArea: { height: CHART_HEIGHT, marginTop: 16 },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  axisLabel: { fontSize: 10, fontWeight: "600" },
});
