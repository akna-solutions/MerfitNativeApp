import { useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Rect } from "react-native-svg";

import { mondayIndex, parseDateKey, WEEKDAY_SHORT } from "../../../../shared/calendar/dates";
import { MergedStepDay } from "../../../../shared/steps/weekStats";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  days: MergedStepDay[];
  todayKey: string;
  /** Kesikli cizgi olarak gosterilen guncel hedef. */
  goal: number;
};

const HEIGHT = 140;

/** Son 7 gunun adimlari; hedefi tamamlanan gunler dolu mavi, hedef kesikli cizgi. */
export function WeeklyStepsChart({ days, todayKey, goal }: Props) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const max = Math.max(goal, ...days.map((d) => d.steps), 1) * 1.1;
  const slot = width / Math.max(days.length, 1);
  const barWidth = Math.min(28, slot * 0.56);
  const goalY = HEIGHT - (goal / max) * HEIGHT;

  return (
    <View>
      <View style={styles.chart} onLayout={onLayout} testID="weekly-steps-chart">
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            {days.map((day, index) => {
              const h = (day.steps / max) * HEIGHT;
              const isToday = day.date === todayKey;
              return (
                <Rect
                  key={day.date}
                  x={index * slot + (slot - barWidth) / 2}
                  y={HEIGHT - Math.max(h, 3)}
                  width={barWidth}
                  height={Math.max(h, 3)}
                  rx={8}
                  fill={day.steps === 0 ? colors.progressTrack : day.goalCompleted ? colors.primary : colors.borderActive}
                  stroke={isToday ? "#00A8FF" : undefined}
                  strokeWidth={isToday ? 2 : 0}
                />
              );
            })}
            <Line x1={0} x2={width} y1={goalY} y2={goalY} stroke={colors.textSecondary} strokeWidth={1} strokeDasharray="4 4" />
          </Svg>
        ) : null}
      </View>
      <View style={styles.labels}>
        {days.map((day) => {
          const date = parseDateKey(day.date);
          const isToday = day.date === todayKey;
          return (
            <Text
              key={day.date}
              style={[styles.label, { color: isToday ? colors.text : colors.textSecondary, fontWeight: isToday ? "800" : "600" }]}
            >
              {isToday ? "Bugün" : date ? WEEKDAY_SHORT[mondayIndex(date)] : ""}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { height: HEIGHT, width: "100%" },
  labels: { flexDirection: "row", marginTop: 8 },
  label: { flex: 1, textAlign: "center", fontSize: 11 },
});
