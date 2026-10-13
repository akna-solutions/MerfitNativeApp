import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeContext";
import type { MiniGameRewardTier } from "../../../../services/api/types";
import { nextTierFor } from "../rewards";
import type { RoundFinish } from "../useMiniGameRewards";

type Props = {
  finish: Exclude<RoundFinish, { kind: "idle" }>;
  /** Oturum acilirken sunucudan gelen odul tablosu (cevrimdisi turda yok). */
  tiers: readonly MiniGameRewardTier[] | null;
  /** Turun puansiz oynanma sebebi (varsa). */
  notice: string | null;
};

/** Oyun sonu ozeti: skor, kazanilan MB FIT puani, onceki/yeni toplam ve bir sonraki odul esigi. */
export function RoundSummary({ finish, tiers, notice }: Props) {
  const { colors } = useTheme();
  const score = finish.result.score;

  return (
    <View testID="dumbbell-dash-summary" style={styles.wrapper}>
      <View style={styles.scoreRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>SKOR</Text>
        <Text style={[styles.scoreValue, { color: colors.text }]}>{score}</Text>
      </View>

      {finish.kind === "submitting" ? (
        <View style={styles.inline}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
          <Text style={[styles.body, { color: colors.textSecondary }]}>Sonuç doğrulanıyor…</Text>
        </View>
      ) : null}

      {finish.kind === "failed" ? (
        <Text style={[styles.body, { color: colors.danger }]}>{finish.message}</Text>
      ) : null}

      {finish.kind === "done" ? <Outcome finish={finish} tiers={tiers} notice={notice} /> : null}
    </View>
  );
}

function Outcome({
  finish,
  tiers,
  notice,
}: {
  finish: Extract<RoundFinish, { kind: "done" }>;
  tiers: readonly MiniGameRewardTier[] | null;
  notice: string | null;
}) {
  const { colors } = useTheme();
  const { reward, result } = finish;

  if (!reward) {
    return <Text style={[styles.body, { color: colors.textSecondary }]}>{notice ?? "Bu tur puan kazandırmadı."}</Text>;
  }

  const next = reward.nextTier ?? (tiers ? nextTierFor(tiers, result.score) : null);
  const nextLine =
    next && reward.status !== "Rejected" && reward.status !== "Expired"
      ? `Sonraki ödül: ${next.minScore} skor = ${next.points} puan (${next.minScore - result.score} skor daha)`
      : null;

  return (
    <View>
      {reward.status === "Rewarded" ? (
        <>
          <Text testID="dumbbell-dash-awarded" style={[styles.award, { color: colors.text }]}>
            +{reward.awardedPoints} MB FIT puanı
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Toplam puanın: {reward.previousTotalPoints.toLocaleString()} → {reward.totalPoints.toLocaleString()}
          </Text>
          {reward.dailyLimitReached ? (
            <Text style={[styles.body, { color: colors.textSecondary }]}>Bugünkü mini oyun puan sınırına ulaştın.</Text>
          ) : null}
        </>
      ) : null}

      {reward.status === "NoReward" ? (
        <Text style={[styles.body, { color: colors.textSecondary }]}>Bu skor puan kazandırmadı.</Text>
      ) : null}

      {reward.status === "DailyLimitReached" ? (
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Bugünkü mini oyun puan sınırına ulaştın; yarın yeniden puan kazanabilirsin.
        </Text>
      ) : null}

      {reward.status === "Rejected" ? (
        <Text style={[styles.body, { color: colors.textSecondary }]}>Bu sonuç doğrulanamadığı için puan verilmedi.</Text>
      ) : null}

      {reward.status === "Expired" || reward.status === "Abandoned" ? (
        <Text style={[styles.body, { color: colors.textSecondary }]}>Oyun oturumunun süresi dolduğu için puan verilmedi.</Text>
      ) : null}

      {nextLine && reward.remainingToday > 0 ? (
        <Text style={[styles.body, { color: colors.textSecondary }]}>{nextLine}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  scoreRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  scoreValue: { fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] },
  inline: { flexDirection: "row", alignItems: "center", gap: 8 },
  award: { fontSize: 17, fontWeight: "800" },
  body: { fontSize: 13, lineHeight: 18 },
});
