import { useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";

import { formatSteps } from "../../../../shared/steps/format";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  hourly: number[];
  /** Icinde bulunulan saat (bugun icin); vurgulanir. */
  currentHour: number | null;
};

const HEIGHT = 120;
const LABEL_HOURS = [0, 6, 12, 18];

/** Gun icinde saat saat atilan adimlar (00-23). */
export function HourlyStepsChart({ hourly, currentHour }: Props) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const max = Math.max(...hourly, 0);
  const peakHour = max > 0 ? hourly.indexOf(max) : null;
  const slot = width / 24;
  const barWidth = Math.max(2, slot * 0.62);

  return (
    <View>
      <View style={styles.chart} onLayout={onLayout} testID="hourly-steps-chart">
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            {hourly.map((steps, hour) => {
              const h = max > 0 ? Math.max(steps > 0 ? 3 : 0, (steps / max) * (HEIGHT - 4)) : 0;
              const isNow = hour === currentHour;
              return (
                <Rect
                  key={hour}
                  x={hour * slot + (slot - barWidth) / 2}
                  y={HEIGHT - Math.max(h, 2)}
                  width={barWidth}
                  height={Math.max(h, 2)}
                  rx={barWidth / 2}
                  fill={steps > 0 ? (isNow ? "#00A8FF" : colors.primary) : colors.progressTrack}
                />
              );
            })}
          </Svg>
        ) : null}
      </View>
      <View style={styles.labels}>
        {LABEL_HOURS.map((hour) => (
          <Text key={hour} style={[styles.label, { color: colors.textSecondary }]}>
            {String(hour).padStart(2, "0")}:00
          </Text>
        ))}
        <Text style={[styles.label, { color: colors.textSecondary }]}>23:00</Text>
      </View>
      <Text style={[styles.caption, { color: colors.textSecondary }]}>
        {peakHour === null
          ? "Bugün henüz adım kaydı yok."
          : `En hareketli saat ${String(peakHour).padStart(2, "0")}:00 · ${formatSteps(max)} adım`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { height: HEIGHT, width: "100%" },
  labels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  label: { fontSize: 10, fontWeight: "600" },
  caption: { fontSize: 12, marginTop: 10 },
});
