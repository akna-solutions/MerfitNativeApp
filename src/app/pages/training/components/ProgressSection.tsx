import { StyleSheet, Text, View } from "react-native";

import { TrainingProgress, TrainingRecovery } from "../../../../services/api/types";
import { formatPercent, RECOVERY_LABELS } from "../../../../shared/training/format";
import { formatKg } from "../../../../shared/workoutHistory/format";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = { progress: TrainingProgress | null; recovery: TrainingRecovery | null };

/** Gelisim ozeti: yalnizca gercek set kayitlarindan uretilen yorumlar; veri yoksa yorum yok. */
export function ProgressSection({ progress, recovery }: Props) {
  const { colors } = useTheme();
  if (!progress) return null;

  const tracked = progress.exercises.filter((e) => e.exposureCount >= 2).slice(0, 6);
  const rate = progress.completionRate4Weeks;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Gelişimin</Text>
      <View style={styles.stats}>
        <Stat label="Son 4 hafta" value={`${progress.completedSessions4Weeks} antrenman`} />
        <Stat label="Son 12 hafta" value={`${progress.completedSessions12Weeks} antrenman`} />
        <Stat label="Tamamlama" value={rate === null ? "-" : `%${Math.round(rate * 100)}`} />
      </View>

      {recovery ? (
        <Text style={[styles.line, { color: colors.textSecondary }]}>
          Toparlanma: <Text style={{ color: colors.text }}>{RECOVERY_LABELS[recovery.status] ?? recovery.status}</Text>
          {recovery.signals.length > 0 ? ` · ${recovery.signals[0]}` : ""}
        </Text>
      ) : null}

      {progress.insights.map((insight, index) => (
        <View key={`${insight.type}-${index}`} style={[styles.insight, { borderColor: colors.border }]}>
          <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
          <Text style={[styles.insightText, { color: colors.text }]}>{insight.message}</Text>
        </View>
      ))}

      {tracked.length > 0 ? (
        <View style={styles.table}>
          {tracked.map((e) => (
            <View key={e.exerciseId} style={styles.tableRow}>
              <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
                {e.name}
              </Text>
              <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>
                {e.lastTopWeightKg ? `${formatKg(e.lastTopWeightKg)} × ${e.lastBestReps ?? "-"}` : "-"}
                {formatPercent(e.estimatedOneRepMaxChangePercent4Weeks) ? ` · ${formatPercent(e.estimatedOneRepMaxChangePercent4Weeks)}` : ""}
              </Text>
            </View>
          ))}
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            Yüzdeler son 4 haftadaki tahmini 1RM değişimidir (Epley formülü; gerçek maksimum ölçümü değildir).
          </Text>
        </View>
      ) : null}

      {progress.insights.length === 0 && tracked.length === 0
        ? progress.dataNotes.slice(0, 2).map((note) => (
            <Text key={note} style={[styles.note, { color: colors.textSecondary }]}>
              {note}
            </Text>
          ))
        : null}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.inputBackground }]}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 10 },
  title: { fontSize: 16, fontWeight: "700" },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, borderRadius: 12, padding: 10 },
  statValue: { fontSize: 13, fontWeight: "700" },
  statLabel: { fontSize: 10, marginTop: 2 },
  line: { fontSize: 12, lineHeight: 17 },
  insight: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  insightText: { flex: 1, fontSize: 13, lineHeight: 18 },
  table: { gap: 6 },
  tableRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  exerciseName: { flex: 1, fontSize: 12, fontWeight: "600" },
  exerciseMeta: { fontSize: 12 },
  note: { fontSize: 11, lineHeight: 15 },
});
