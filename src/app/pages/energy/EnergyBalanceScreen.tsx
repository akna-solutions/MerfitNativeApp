import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  EnergyDay,
  EnergyInsight,
  EnergyRange,
  getEnergyDay,
  getEnergyRange,
} from "../../../services/api/energyBalance";
import { addDays, MONTH_NAMES, parseDateKey, toDateKey } from "../../../shared/calendar/dates";
import {
  balanceLabel,
  BREAKDOWN_COLORS,
  breakdownItems,
  clampCustomRange,
  formatKcalValue,
  formatSignedKcal,
  goalLabel,
  PeriodKey,
  PERIODS,
  periodRange,
  toneColor,
  withLiveSteps,
} from "../../../shared/energy/energy";
import { DumbbellSpinner } from "../../../shared/motion/DumbbellSpinner";
import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { formatKm, formatSteps } from "../../../shared/steps/format";
import { useStepCounter } from "../../../shared/steps/StepCounterContext";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { BalanceChart, IntakeExpenditureChart, StackedBar } from "./components/EnergyCharts";

const tr = (value: number) => Math.round(value).toLocaleString("tr-TR");

function dateLabel(key: string): string {
  const date = parseDateKey(key);
  return date ? `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}` : key;
}

type Loaders = {
  loadDay: (date: string, signal?: AbortSignal) => Promise<EnergyDay>;
  loadRange: (from: string, to: string, signal?: AbortSignal) => Promise<EnergyRange>;
};

/** Ayrintili kalori analizi: ana sayfadaki kalori dengesi kartina dokununca acilir. */
export function EnergyBalanceScreen() {
  const counter = useStepCounter();
  return (
    <EnergyBalanceContent
      todayKey={counter.todayKey}
      localTodaySteps={counter.todaySteps}
      caloriesPerStep={counter.settings.caloriesPerStep}
    />
  );
}

type ContentProps = Partial<Loaders> & {
  todayKey?: string;
  localTodaySteps: number;
  caloriesPerStep: number;
  initialPeriod?: PeriodKey;
};

export function EnergyBalanceContent({
  todayKey = toDateKey(new Date()),
  localTodaySteps,
  caloriesPerStep,
  initialPeriod = "today",
  loadDay = getEnergyDay,
  loadRange = getEnergyRange,
}: ContentProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodKey>(initialPeriod);
  const [custom, setCustom] = useState(() => periodRange("week", todayKey));
  const [day, setDay] = useState<EnergyDay | null>(null);
  const [range, setRange] = useState<EnergyRange | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isDayView = period === "today" || period === "yesterday";
  const { from, to } = period === "custom" ? custom : periodRange(period, todayKey);
  // Gun gorunumunde de son 7 gun grafigi gosterilir.
  const chartRange = isDayView ? periodRange("week", todayKey) : { from, to };

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setLoading(true);
      setError(false);
      const dayRequest = isDayView ? loadDay(from, controller.signal) : Promise.resolve(null);
      Promise.all([dayRequest, loadRange(chartRange.from, chartRange.to, controller.signal)])
        .then(([dayResult, rangeResult]) => {
          setDay(dayResult);
          setRange(rangeResult);
          setLoading(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setError(true);
          setLoading(false);
        });
      return () => controller.abort();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDayView, from, to, chartRange.from, chartRange.to, loadDay, loadRange]),
  );

  const liveDay = useMemo(
    () => (day ? withLiveSteps(day, localTodaySteps, caloriesPerStep) : null),
    [day, localTodaySteps, caloriesPerStep],
  );

  const subtitle = isDayView ? (from === todayKey ? "Bugün" : dateLabel(from)) : `${dateLabel(from)} – ${dateLabel(to)}`;

  return (
    <ProfileDetailShell title="Kalori Analizi" subtitle={subtitle}>
      <View style={styles.periods} testID="energy-periods">
        {PERIODS.map((p) => {
          const active = p.key === period;
          return (
            <Pressable
              key={p.key}
              onPress={() => setPeriod(p.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              testID={`energy-period-${p.key}`}
              style={[
                styles.periodChip,
                { backgroundColor: active ? colors.primary : colors.inputBackground, borderColor: active ? colors.primary : colors.border },
              ]}
            >
              <Text style={[styles.periodText, { color: active ? "#FFFFFF" : colors.text }]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {period === "custom" ? (
        <CustomRangePicker
          from={custom.from}
          to={custom.to}
          todayKey={todayKey}
          onChange={(next) => setCustom(clampCustomRange(next.from, next.to, todayKey))}
        />
      ) : null}

      {loading && !(day || range) ? (
        <View style={styles.center}>
          <DumbbellSpinner color={colors.primary} />
        </View>
      ) : error ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="energy-error">
          <Text style={[styles.body, { color: colors.text }]}>
            Kalori verisi alınamadı. Bağlantını kontrol edip tekrar dene; kayıtların cihazında ve sunucuda güvende.
          </Text>
        </View>
      ) : isDayView && liveDay ? (
        <DayView day={liveDay} pendingSteps={liveDay.pendingSteps} onOpenNutrition={() => router.navigate("/pages/nutrition" as never)} />
      ) : range ? (
        <RangeSummary range={range} />
      ) : null}

      {range && !error ? (
        <>
          <Section title={isDayView ? "Son 7 gün kalori dengesi" : "Günlük kalori dengesi"}>
            <BalanceChart days={range.days} />
          </Section>
          <Section title="Alınan ve harcanan kalori">
            <IntakeExpenditureChart days={range.days} target={range.targetCalories} />
          </Section>
          {!isDayView ? <WeeklyAverages range={range} /> : null}
        </>
      ) : null}

      <Text style={[styles.footnote, { color: colors.textSecondary }]}>
        Değerler tahminidir ve tıbbi tavsiye değildir. Harcanan = bazal metabolizma + adım ve antrenman kalorisi + besinlerin
        termik etkisi; antrenman sırasında atılan adımlar iki kez sayılmaz. Apple Health / Health Connect'teki aktif
        enerji verisi bu sürümde okunmaz.
      </Text>
    </ProfileDetailShell>
  );
}

function DayView({ day, pendingSteps, onOpenNutrition }: { day: EnergyDay; pendingSteps: number; onOpenNutrition: () => void }) {
  const { colors } = useTheme();
  const tone = toneColor(day.tone, colors);
  const items = breakdownItems(day);
  const n = day.nutrition;
  const mealTotal = Math.max(1, n.meals.reduce((s, m) => s + m.calories, 0));

  return (
    <>
      {/* A) Gunluk ozet */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="energy-day-summary">
        <View style={styles.summaryRow}>
          <SummaryValue label="Alınan" value={tr(day.intakeCalories)} />
          <SummaryValue label={day.isToday ? "Harcanan (şu ana kadar)" : "Harcanan"} value={day.expenditureCalories === null ? "—" : tr(day.expenditureCalories)} />
          <SummaryValue label="Net denge" value={day.balance === null ? "—" : formatSignedKcal(day.balance).replace(" kcal", "")} color={tone} testID="energy-net-balance" />
        </View>
        <View style={[styles.headline, { backgroundColor: colors.inputBackground }]}>
          <View style={[styles.dot, { backgroundColor: tone }]} />
          <View style={styles.flex}>
            <Text style={[styles.headlineTitle, { color: colors.text }]}>{balanceLabel(day.balance)}</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]} testID="energy-headline">{day.headline}</Text>
          </View>
        </View>
        <View style={styles.goalRow}>
          <Meta label="Hedef" value={goalLabel(day.goalDirection)} />
          <Meta label="Günlük hedef" value={formatKcalValue(day.targetCalories)} />
          <Meta
            label={day.remainingCalories !== null && day.remainingCalories < 0 ? "Aşılan" : "Kalan"}
            value={day.remainingCalories === null ? "—" : formatKcalValue(Math.abs(day.remainingCalories))}
          />
        </View>
        {day.plannedBalance !== null && day.goalDirection !== "maintain" ? (
          <Text style={[styles.small, { color: colors.textSecondary }]}>
            Hedefin öngördüğü günlük denge: {formatSignedKcal(day.plannedBalance)}
          </Text>
        ) : null}
        {pendingSteps > 0 ? (
          <Text style={[styles.small, { color: colors.textSecondary }]} testID="energy-pending-steps">
            {formatSteps(pendingSteps)} adım henüz senkronize edilmedi; tahmini olarak eklendi.
          </Text>
        ) : null}
      </View>

      {day.insights.length > 0 ? <Insights insights={day.insights} /> : null}

      {/* B) Harcama dagilimi */}
      <Section title="Kalori harcama dağılımı">
        <StackedBar
          testID="energy-breakdown-bar"
          parts={items.map((i) => ({ key: i.key, value: i.value, color: BREAKDOWN_COLORS[i.key] }))}
        />
        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.key} style={styles.listRow}>
              <View style={[styles.legendDot, { backgroundColor: BREAKDOWN_COLORS[item.key] }]} />
              <Text style={[styles.listLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              <Text style={[styles.listValue, { color: colors.text }]}>
                {item.key === "bmr" && day.expenditure.bmr === null ? "—" : formatKcalValue(item.value)}
              </Text>
            </View>
          ))}
        </View>
        {day.expenditure.deduplicatedStepCalories > 0 ? (
          <Text style={[styles.small, { color: colors.textSecondary }]}>
            Antrenmanla çakışan {formatSteps(day.activity.overlappingSteps)} adımın {tr(day.expenditure.deduplicatedStepCalories)} kcal'si
            antrenmana dahil olduğu için tekrar eklenmedi.
          </Text>
        ) : null}
      </Section>

      {/* C) Beslenme analizi */}
      <Section title="Beslenme analizi">
        <Macro label="Protein" value={n.protein} target={n.proteinTarget} color="#3E7BFA" />
        <Macro label="Karbonhidrat" value={n.carbs} target={n.carbsTarget} color="#00A8FF" />
        <Macro label="Yağ" value={n.fat} target={n.fatTarget} color="#F59E0B" />
        <Text style={[styles.subheading, { color: colors.text }]}>Öğünlere göre kalori</Text>
        {n.meals.map((meal) => (
          <View key={meal.type} style={styles.mealRow}>
            <Text style={[styles.mealLabel, { color: colors.textSecondary }]}>{meal.label}</Text>
            <View style={[styles.mealTrack, { backgroundColor: colors.progressTrack }]}>
              <View style={[styles.mealFill, { flex: meal.calories / mealTotal, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.mealValue, { color: colors.text }]}>{tr(meal.calories)}</Text>
          </View>
        ))}
        {!day.dataQuality.hasMeals ? (
          <Pressable onPress={onOpenNutrition} accessibilityRole="button" testID="energy-open-nutrition">
            <Text style={[styles.link, { color: colors.primary }]}>Öğün ekle</Text>
          </Pressable>
        ) : null}
      </Section>

      {/* D) Aktivite analizi */}
      <Section title="Aktivite analizi">
        <View style={styles.tiles}>
          <Tile icon="footsteps-outline" label="Günlük adım" value={formatSteps(day.activity.steps)} />
          <Tile icon="navigate-outline" label="Yürüyüş mesafesi" value={formatKm(day.activity.distanceMeters / 1000)} />
          <Tile icon="time-outline" label="Antrenman süresi" value={`${day.activity.workoutMinutes} dk`} />
          <Tile icon="flame-outline" label="Antrenman kalorisi" value={formatKcalValue(day.activity.workoutCalories)} />
        </View>
        {day.activity.workouts.map((w) => (
          <View key={w.sessionId} style={styles.listRow}>
            <Ionicons name="barbell-outline" size={14} color={colors.iconActive} />
            <Text style={[styles.listLabel, { color: colors.textSecondary }]} numberOfLines={1}>{w.title || "Antrenman"} · {w.minutes} dk</Text>
            <Text style={[styles.listValue, { color: colors.text }]}>{formatKcalValue(w.calories)}</Text>
          </View>
        ))}
      </Section>
    </>
  );
}

function RangeSummary({ range }: { range: EnergyRange }) {
  const { colors } = useTheme();
  const s = range.summary;
  const tone = s.averageBalance === null ? colors.primary : toneColor(toneForAverage(s.averageBalance, range.goalDirection), colors);
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="energy-range-summary">
      <View style={styles.summaryRow}>
        <SummaryValue label="Ort. alınan" value={s.averageIntake === null ? "—" : tr(s.averageIntake)} />
        <SummaryValue label="Ort. harcanan" value={s.averageExpenditure === null ? "—" : tr(s.averageExpenditure)} />
        <SummaryValue label="Ort. denge" value={s.averageBalance === null ? "—" : formatSignedKcal(s.averageBalance).replace(" kcal", "")} color={tone} testID="energy-average-balance" />
      </View>
      <Text style={[styles.small, { color: colors.textSecondary }]}>
        {s.completeDays} / {s.totalDays} gün hesaba katıldı (besin kaydı olan, tamamlanmış günler).
      </Text>
      <View style={styles.goalRow}>
        <Meta label="Toplam denge" value={formatSignedKcal(s.totalBalance)} />
        <Meta label="Tahmini değişim" value={s.estimatedWeightChangeKg === null ? "—" : `${s.estimatedWeightChangeKg > 0 ? "+" : ""}${s.estimatedWeightChangeKg.toLocaleString("tr-TR")} kg`} />
        <Meta label="Tartı" value={s.weight.changeKg === null ? "—" : `${s.weight.changeKg > 0 ? "+" : ""}${s.weight.changeKg.toLocaleString("tr-TR")} kg`} />
      </View>
      {s.analysis ? (
        <Text style={[styles.body, { color: colors.textSecondary }]} testID="energy-range-analysis">{s.analysis}</Text>
      ) : null}
    </View>
  );
}

/** Ortalama denge icin ayni renk mantigi (yalnizca hedef yonune gore kaba ayrim; ayrintili kurallar sunucuda). */
function toneForAverage(balance: number, direction: EnergyRange["goalDirection"]) {
  if (direction === "lose") return balance <= -150 ? "green" : balance >= 150 ? "orange" : "blue";
  if (direction === "gain") return balance >= 150 ? "green" : balance <= -150 ? "red" : "blue";
  if (direction === "maintain") return Math.abs(balance) <= 250 ? "green" : balance > 0 ? "orange" : "blue";
  return "blue";
}

function WeeklyAverages({ range }: { range: EnergyRange }) {
  const { colors } = useTheme();
  return (
    <Section title="Haftalık ortalama açık / fazla">
      {range.weeks.map((week) => (
        <View key={week.start} style={styles.listRow} testID="energy-week-row">
          <Text style={[styles.listLabel, { color: colors.textSecondary }]}>
            {dateLabel(week.start)} – {dateLabel(week.end)} · {week.completeDays} gün
          </Text>
          <Text style={[styles.listValue, { color: colors.text }]}>{formatSignedKcal(week.averageBalance)}</Text>
        </View>
      ))}
    </Section>
  );
}

function CustomRangePicker({ from, to, todayKey, onChange }: {
  from: string;
  to: string;
  todayKey: string;
  onChange: (next: { from: string; to: string }) => void;
}) {
  const { colors } = useTheme();
  const shift = (key: string, days: number) => toDateKey(addDays(parseDateKey(key)!, days));
  return (
    <View style={[styles.card, styles.customCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID="energy-custom-range">
      <Stepper label="Başlangıç" value={from} testID="energy-custom-from" canForward={from < to} onShift={(d) => onChange({ from: shift(from, d), to })} />
      <Stepper label="Bitiş" value={to} testID="energy-custom-to" canForward={to < todayKey} onShift={(d) => onChange({ from, to: shift(to, d) })} />
    </View>
  );
}

function Stepper({ label, value, onShift, canForward, testID }: {
  label: string;
  value: string;
  onShift: (days: number) => void;
  canForward: boolean;
  testID: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepper}>
      <Text style={[styles.small, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable onPress={() => onShift(-1)} hitSlop={8} accessibilityLabel={`${label} bir gün geri`} testID={`${testID}-prev`}>
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
        </Pressable>
        <Text style={[styles.stepperValue, { color: colors.text }]} testID={testID}>{dateLabel(value)}</Text>
        <Pressable
          onPress={() => onShift(1)}
          disabled={!canForward}
          hitSlop={8}
          accessibilityLabel={`${label} bir gün ileri`}
          testID={`${testID}-next`}
        >
          <Ionicons name="chevron-forward" size={18} color={canForward ? colors.primary : colors.icon} />
        </Pressable>
      </View>
    </View>
  );
}

function Insights({ insights }: { insights: EnergyInsight[] }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="energy-insights">
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Günün yorumu</Text>
      {insights.map((insight) => (
        <View key={insight.code} style={styles.insightRow}>
          <View style={[styles.dot, styles.insightDot, { backgroundColor: toneColor(insight.tone, colors) }]} />
          <Text style={[styles.body, styles.flex, { color: colors.text }]}>{insight.text}</Text>
        </View>
      ))}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function SummaryValue({ label, value, color, testID }: { label: string; value: string; color?: string; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.small, { color: colors.textSecondary }]} numberOfLines={2}>{label}</Text>
      <Text style={[styles.summaryValue, { color: color ?? colors.text }]} numberOfLines={1} adjustsFontSizeToFit testID={testID}>
        {value}
      </Text>
      <Text style={[styles.small, { color: colors.textSecondary }]}>kcal</Text>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.meta}>
      <Text style={[styles.small, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

function Macro({ label, value, target, color }: { label: string; value: number; target: number | null; color: string }) {
  const { colors } = useTheme();
  const ratio = target && target > 0 ? Math.min(1, value / target) : 0;
  return (
    <View style={styles.macro}>
      <View style={styles.macroHeader}>
        <Text style={[styles.listLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.listValue, { color: colors.text }]}>
          {tr(value)}{target ? ` / ${tr(target)}` : ""} g
        </Text>
      </View>
      <View style={[styles.macroTrack, { backgroundColor: colors.progressTrack }]}>
        <View style={{ width: `${ratio * 100}%`, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
}

function Tile({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: colors.inputBackground }]}>
      <Ionicons name={icon} size={14} color={colors.iconActive} />
      <Text style={[styles.small, { color: colors.textSecondary }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.tileValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { paddingVertical: 48, alignItems: "center" },
  periods: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  periodChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  periodText: { fontSize: 13, fontWeight: "700" },
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 14, gap: 10 },
  customCard: { flexDirection: "row", justifyContent: "space-between" },
  summaryRow: { flexDirection: "row", gap: 10 },
  summaryItem: { flex: 1 },
  summaryValue: { fontSize: 24, fontWeight: "800", marginTop: 2 },
  headline: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 14, alignItems: "flex-start" },
  headlineTitle: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  goalRow: { flexDirection: "row", gap: 10 },
  meta: { flex: 1 },
  metaValue: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  body: { fontSize: 13, lineHeight: 19 },
  small: { fontSize: 11, lineHeight: 15 },
  sectionTitle: { fontSize: 15, fontWeight: "800" },
  subheading: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  list: { gap: 8 },
  listRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  listLabel: { flex: 1, fontSize: 13 },
  listValue: { fontSize: 13, fontWeight: "700" },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  macro: { gap: 5 },
  macroHeader: { flexDirection: "row", alignItems: "center" },
  macroTrack: { height: 8, borderRadius: 4, overflow: "hidden", flexDirection: "row" },
  mealRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  mealLabel: { width: 96, fontSize: 12 },
  mealTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden", flexDirection: "row" },
  mealFill: { borderRadius: 4 },
  mealValue: { width: 48, textAlign: "right", fontSize: 12, fontWeight: "700" },
  link: { fontSize: 13, fontWeight: "700" },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { width: "48%", flexGrow: 1, borderRadius: 14, padding: 10, gap: 3 },
  tileValue: { fontSize: 16, fontWeight: "800" },
  insightRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  insightDot: { width: 8, height: 8, marginTop: 6 },
  stepper: { flex: 1, gap: 4 },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepperValue: { fontSize: 14, fontWeight: "700" },
  footnote: { fontSize: 11, lineHeight: 16, marginTop: 4, marginBottom: 12 },
});
