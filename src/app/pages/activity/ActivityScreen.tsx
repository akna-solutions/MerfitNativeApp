import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getWeeklyStepSummary, StepWeeklySummary } from "../../../services/api/steps";
import { MONTH_NAMES, parseDateKey } from "../../../shared/calendar/dates";
import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { StepRing } from "../../../shared/steps/components/StepRing";
import { formatKcal, formatKm, formatPercent, formatSteps } from "../../../shared/steps/format";
import { EMPTY_HOURLY, StepCounterValue, useStepCounter } from "../../../shared/steps/StepCounterContext";
import { estimateFromSteps, goalProgress } from "../../../shared/steps/stepState";
import { buildWeekStats } from "../../../shared/steps/weekStats";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { HourlyStepsChart } from "./components/HourlyStepsChart";
import { WeeklyStepsChart } from "./components/WeeklyStepsChart";

function dayLabel(key: string, todayKey: string): string {
  if (key === todayKey) return "Bugün";
  const date = parseDateKey(key);
  return date ? `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}` : key;
}

function formatSyncTime(timestamp: number | null): string {
  if (!timestamp) return "Henüz senkronize edilmedi";
  const date = new Date(timestamp);
  return `Son senkronizasyon ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Gunluk aktivite detayi: bugunun saatlik adimlari, hedef, son 7 gun karsilastirmasi ve istatistikler. */
export function ActivityScreen() {
  const counter = useStepCounter();
  return <ActivityContent counter={counter} />;
}

type ContentProps = {
  counter: StepCounterValue;
  /** Testlerde sunucu cagrisini degistirmek icin. */
  loadSummary?: (endDate: string, signal?: AbortSignal) => Promise<StepWeeklySummary>;
};

export function ActivityContent({ counter, loadSummary = getWeeklyStepSummary }: ContentProps) {
  const { colors } = useTheme();
  const [summary, setSummary] = useState<StepWeeklySummary | null>(null);
  const [summaryFailed, setSummaryFailed] = useState(false);
  const { todayKey, todaySteps, dailyGoal, settings, days } = counter;

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      // Ekran acilinca bekleyen adimlar once gonderilir ki sunucu ozeti guncel olsun.
      void counter
        .syncNow()
        .catch(() => undefined)
        .then(() => loadSummary(todayKey, controller.signal))
        .then((result) => {
          setSummary(result);
          setSummaryFailed(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) setSummaryFailed(true);
        });
      return () => controller.abort();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [todayKey, loadSummary]),
  );

  const progress = goalProgress(todaySteps, dailyGoal);
  const today = estimateFromSteps(todaySteps, settings);
  const hourly = days[todayKey]?.hourly ?? EMPTY_HOURLY;
  const week = useMemo(
    () => buildWeekStats(todayKey, days, summary, dailyGoal, settings),
    [todayKey, days, summary, dailyGoal, settings],
  );
  const currentHour = new Date().getHours();
  const tracking = counter.status === "granted";

  return (
    <ProfileDetailShell title="Günlük Aktivite" subtitle={dayLabel(todayKey, todayKey)}>
      {!tracking && counter.status !== "checking" ? (
        <View style={[styles.notice, { backgroundColor: colors.cardActive, borderColor: colors.borderActive }]} testID="activity-permission-notice">
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <View style={styles.noticeTexts}>
            <Text style={[styles.noticeText, { color: colors.text }]}>
              {counter.status === "denied"
                ? "Hareket izni kapalı olduğu için bu cihazda adım sayılmıyor."
                : counter.status === "undetermined"
                  ? "Adım sayar henüz başlatılmadı."
                  : "Bu cihazda adım sensörü kullanılamıyor."}
            </Text>
            {counter.status === "denied" || counter.status === "undetermined" ? (
              <Pressable onPress={counter.mustOpenSettings ? counter.openSettings : () => void counter.requestPermission()} hitSlop={8}>
                <Text style={[styles.noticeAction, { color: colors.primary }]}>
                  {counter.mustOpenSettings ? "Ayarları aç" : "İzin ver"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={[styles.card, styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <StepRing ratio={progress.ratio} size={176} stroke={16} testID="activity-ring">
          <Text style={[styles.heroSteps, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit testID="activity-today-steps">
            {formatSteps(todaySteps)}
          </Text>
          <Text style={[styles.heroUnit, { color: colors.textSecondary }]}>/ {formatSteps(dailyGoal)} adım</Text>
        </StepRing>
        <Text style={[styles.heroPercent, { color: progress.completed ? colors.primary : colors.text }]} testID="activity-percent">
          {progress.completed ? "Günlük hedef tamamlandı ✓" : `${formatPercent(progress.percent)} tamamlandı`}
        </Text>
        {!progress.completed ? (
          <Text style={[styles.heroRemaining, { color: colors.textSecondary }]}>{formatSteps(progress.remaining)} adım kaldı</Text>
        ) : null}

        <View style={styles.tiles}>
          <Tile icon="navigate-outline" label="Mesafe" value={formatKm(today.distanceKm)} />
          <Tile icon="flame-outline" label="Kalori" value={formatKcal(today.calories)} />
          <View
            style={[styles.tile, { backgroundColor: colors.inputBackground }]}
            accessible
            accessibilityLabel={`Günlük hedef ${formatSteps(dailyGoal)} adım, profiline göre otomatik belirlendi`}
            testID="activity-goal-tile"
          >
            <View style={styles.tileHeader}>
              <Ionicons name="flag-outline" size={14} color={colors.iconActive} />
              <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>Hedef</Text>
            </View>
            <Text style={[styles.tileValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatSteps(dailyGoal)}
            </Text>
          </View>
        </View>
        <Text style={[styles.estimateNote, { color: colors.textSecondary }]}>
          Mesafe ve kalori boy ve kilona göre tahmini hesaplanır.
        </Text>
        <Text style={[styles.estimateNote, { color: colors.textSecondary }]} testID="activity-goal-reason">
          {settings.goalReason ?? "Günlük adım hedefin profiline göre otomatik belirlenir."}
        </Text>
      </View>

      <Section title="Saatlik adımlar">
        <HourlyStepsChart hourly={hourly} currentHour={currentHour} />
      </Section>

      <Section title="Son 7 gün">
        <WeeklyStepsChart days={week.days} todayKey={todayKey} goal={dailyGoal} />
        <View style={styles.statGrid}>
          <Stat label="Toplam adım" value={formatSteps(week.totalSteps)} />
          <Stat label="Günlük ortalama" value={formatSteps(week.averageSteps)} />
          <Stat
            label="En aktif gün"
            value={week.mostActiveDay ? dayLabel(week.mostActiveDay.date, todayKey) : "—"}
            detail={week.mostActiveDay ? `${formatSteps(week.mostActiveDay.steps)} adım` : undefined}
          />
          <Stat
            label="Hedef tamamlama"
            value={formatPercent(week.goalCompletionRate)}
            detail={`${week.goalCompletedDays}/7 gün`}
          />
          <Stat label="Yürüme mesafesi" value={formatKm(week.totalDistanceKm)} />
          <Stat label="Tahmini kalori" value={formatKcal(week.totalCalories)} />
        </View>
        {week.changePercent !== null ? (
          <View style={styles.compareRow} testID="activity-compare">
            <Ionicons
              name={week.changePercent >= 0 ? "trending-up" : "trending-down"}
              size={16}
              color={week.changePercent >= 0 ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.compareText, { color: colors.textSecondary }]}>
              Önceki 7 güne göre {week.changePercent >= 0 ? "+" : "-"}
              {formatPercent(Math.abs(week.changePercent))} adım
            </Text>
          </View>
        ) : null}
      </Section>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Ionicons
            name={counter.hasPendingSync ? "cloud-offline-outline" : "cloud-done-outline"}
            size={14}
            color={colors.textSecondary}
          />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {counter.hasPendingSync
              ? "Bazı adımlar henüz sunucuya gönderilmedi; bağlantı olduğunda otomatik gönderilecek."
              : formatSyncTime(counter.lastSyncAt)}
          </Text>
        </View>
        {summaryFailed ? (
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Geçmiş veriler alınamadı; şu an yalnızca bu cihazdaki adımlar gösteriliyor.
          </Text>
        ) : null}
        {!counter.backgroundHistorySupported && tracking ? (
          <Text style={[styles.footerText, { color: colors.textSecondary }]} testID="activity-android-note">
            Android'de adımlar MB Fit açıkken sayılır; uygulama kapalıyken atılan adımlar bu sürümde eklenmez.
          </Text>
        ) : null}
      </View>
    </ProfileDetailShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>{children}</View>
    </View>
  );
}

function Tile({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: colors.inputBackground }]}>
      <View style={styles.tileHeader}>
        <Ionicons name={icon} size={14} color={colors.iconActive} />
        <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.tileValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.inputBackground }]}>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {detail ? (
        <Text style={[styles.statDetail, { color: colors.textSecondary }]} numberOfLines={1}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  hero: { alignItems: "center", marginTop: 8 },
  heroSteps: { fontSize: 34, fontWeight: "800", letterSpacing: -0.8, maxWidth: 130 },
  heroUnit: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  heroPercent: { fontSize: 16, fontWeight: "800", marginTop: 14 },
  heroRemaining: { fontSize: 13, fontWeight: "600", marginTop: 3 },
  tiles: { flexDirection: "row", gap: 8, marginTop: 16, alignSelf: "stretch" },
  tile: { flex: 1, minWidth: 0, borderRadius: 14, padding: 10, gap: 4 },
  tileHeader: { flexDirection: "row", alignItems: "center", gap: 4 },
  tileLabel: { fontSize: 11, fontWeight: "700", flexShrink: 1 },
  tileValue: { fontSize: 16, fontWeight: "800" },
  estimateNote: { fontSize: 11, marginTop: 10, textAlign: "center" },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginBottom: 10 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  stat: { width: "48%", flexGrow: 1, borderRadius: 14, padding: 12, gap: 2 },
  statLabel: { fontSize: 11, fontWeight: "700" },
  statValue: { fontSize: 18, fontWeight: "800" },
  statDetail: { fontSize: 11, fontWeight: "600" },
  compareRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  compareText: { fontSize: 12, fontWeight: "600" },
  notice: { flexDirection: "row", gap: 10, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 12, marginTop: 8 },
  noticeTexts: { flex: 1, gap: 6 },
  noticeText: { fontSize: 13, lineHeight: 18 },
  noticeAction: { fontSize: 13, fontWeight: "800" },
  footer: { marginTop: 20, gap: 8 },
  footerRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  footerText: { fontSize: 12, lineHeight: 17, flexShrink: 1 },
});
