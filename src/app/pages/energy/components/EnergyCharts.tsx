import { useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Rect } from "react-native-svg";

import type { EnergyRangeDay } from "../../../../services/api/energyBalance";
import { mondayIndex, parseDateKey, WEEKDAY_SHORT } from "../../../../shared/calendar/dates";
import { toneColor } from "../../../../shared/energy/energy";
import { useTheme } from "../../../../shared/theme/ThemeContext";

const tr = (value: number) => Math.round(value).toLocaleString("tr-TR");

function axisLabel(key: string, count: number, index: number): string {
  const date = parseDateKey(key);
  if (!date) return "";
  if (count <= 7) return WEEKDAY_SHORT[mondayIndex(date)];
  // Uzun aralikta yalnizca birkac etiket (ilk, son ve aradaki her ~7 gun).
  const step = Math.ceil(count / 5);
  return index === count - 1 || index % step === 0 ? `${date.getDate()}.${date.getMonth() + 1}` : "";
}

function useWidth() {
  const [width, setWidth] = useState(0);
  return { width, onLayout: (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width) };
}

const BALANCE_HEIGHT = 150;

/**
 * Gunluk kalori dengesi: sifir cizgisinin ustu fazla, alti acik. Cubuk rengi sunucunun hedefe gore verdigi durumdur.
 * Besin kaydi olmayan / hesaplanamayan gunler ince gri isaretle gosterilir (sifir gibi yorumlanmaz).
 */
export function BalanceChart({ days, testID = "energy-balance-chart" }: { days: EnergyRangeDay[]; testID?: string }) {
  const { colors } = useTheme();
  const { width, onLayout } = useWidth();
  const values = days.map((d) => (d.hasMeals && d.balance !== null ? d.balance : 0));
  const maxAbs = Math.max(300, ...values.map((v) => Math.abs(v))) * 1.1;
  const slot = width / Math.max(days.length, 1);
  const barWidth = Math.max(3, Math.min(22, slot * 0.6));
  const mid = BALANCE_HEIGHT / 2;

  return (
    <View>
      <View style={{ height: BALANCE_HEIGHT }} onLayout={onLayout} testID={testID}>
        {width > 0 ? (
          <Svg width={width} height={BALANCE_HEIGHT}>
            <Line x1={0} x2={width} y1={mid} y2={mid} stroke={colors.textSecondary} strokeWidth={1} strokeDasharray="4 4" />
            {days.map((day, index) => {
              const x = index * slot + (slot - barWidth) / 2;
              if (!day.hasMeals || day.balance === null) {
                return <Rect key={day.date} x={x} y={mid - 1.5} width={barWidth} height={3} rx={1.5} fill={colors.progressTrack} />;
              }
              const h = Math.max(3, (Math.abs(day.balance) / maxAbs) * mid);
              return (
                <Rect
                  key={day.date}
                  x={x}
                  y={day.balance >= 0 ? mid - h : mid}
                  width={barWidth}
                  height={h}
                  rx={Math.min(6, barWidth / 2)}
                  fill={toneColor(day.tone, colors)}
                  opacity={day.isComplete ? 1 : 0.55}
                />
              );
            })}
          </Svg>
        ) : null}
      </View>
      <Labels days={days} />
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>Üst: fazla · Alt: açık · Gri: kayıt yok</Text>
      </View>
    </View>
  );
}

const PAIR_HEIGHT = 140;

/** Gunluk alinan (mavi) ve harcanan (acik gri) kalori karsilastirmasi. */
export function IntakeExpenditureChart({ days, target }: { days: EnergyRangeDay[]; target: number | null }) {
  const { colors } = useTheme();
  const { width, onLayout } = useWidth();
  const max = Math.max(target ?? 0, 1500, ...days.map((d) => Math.max(d.intakeCalories, d.expenditureCalories ?? 0))) * 1.1;
  const slot = width / Math.max(days.length, 1);
  const bar = Math.max(2, Math.min(11, slot * 0.32));
  const targetY = target ? PAIR_HEIGHT - (target / max) * PAIR_HEIGHT : null;

  return (
    <View>
      <View style={{ height: PAIR_HEIGHT }} onLayout={onLayout} testID="energy-intake-expenditure-chart">
        {width > 0 ? (
          <Svg width={width} height={PAIR_HEIGHT}>
            {days.map((day, index) => {
              const center = index * slot + slot / 2;
              const ih = (day.intakeCalories / max) * PAIR_HEIGHT;
              const eh = ((day.expenditureCalories ?? 0) / max) * PAIR_HEIGHT;
              return [
                <Rect key={`${day.date}-i`} x={center - bar - 1} y={PAIR_HEIGHT - ih} width={bar} height={ih} rx={Math.min(4, bar / 2)} fill={colors.primary} />,
                <Rect key={`${day.date}-e`} x={center + 1} y={PAIR_HEIGHT - eh} width={bar} height={eh} rx={Math.min(4, bar / 2)} fill={colors.icon} />,
              ];
            })}
            {targetY !== null ? (
              <Line x1={0} x2={width} y1={targetY} y2={targetY} stroke={colors.textSecondary} strokeWidth={1} strokeDasharray="4 4" />
            ) : null}
          </Svg>
        ) : null}
      </View>
      <Labels days={days} />
      <View style={styles.legendRow}>
        <LegendDot color={colors.primary} label="Alınan" />
        <LegendDot color={colors.icon} label="Harcanan" />
        {target ? <Text style={[styles.legendText, { color: colors.textSecondary }]}>Kesikli: hedef {tr(target)} kcal</Text> : null}
      </View>
    </View>
  );
}

function Labels({ days }: { days: EnergyRangeDay[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.labels}>
      {days.map((day, index) => (
        <Text
          key={day.date}
          numberOfLines={1}
          style={[styles.label, { color: day.isToday ? colors.text : colors.textSecondary, fontWeight: day.isToday ? "800" : "600" }]}
        >
          {day.isToday && days.length <= 7 ? "Bugün" : axisLabel(day.date, days.length, index)}
        </Text>
      ))}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

/** Yatay yigilmis cubuk (harcama dagilimi). */
export function StackedBar({ parts, testID }: { parts: { key: string; value: number; color: string }[]; testID?: string }) {
  const { colors } = useTheme();
  const total = parts.reduce((sum, p) => sum + Math.max(0, p.value), 0);
  return (
    <View style={[styles.stack, { backgroundColor: colors.progressTrack }]} testID={testID}>
      {total > 0
        ? parts
            .filter((p) => p.value > 0)
            .map((p) => <View key={p.key} style={{ flex: p.value / total, backgroundColor: p.color }} />)
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: "row", marginTop: 6 },
  label: { flex: 1, textAlign: "center", fontSize: 10 },
  legend: { marginTop: 6, alignItems: "center" },
  legendRow: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },
  stack: { height: 12, borderRadius: 6, overflow: "hidden", flexDirection: "row" },
});
