import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/ThemeContext";
import type { MiniGameResult } from "../../../services/api/types";
import { RewardInfo } from "./components/RewardInfo";
import { RoundSummary } from "./components/RoundSummary";
import { DumbbellDashGame, type GameOverResult } from "./DumbbellDashGame";
import { useMiniGameRewards } from "./useMiniGameRewards";

type Props = {
  /** Baslik altindaki kisa aciklama (giris noktasina gore). */
  subtitle: string;
  onClose: () => void;
  /** true iken oyun ilerlemez (orn. antrenman duraklatildi). */
  suspended?: boolean;
  /** Degistiginde calisan oyun bir kez duraklatilir (orn. dinlenme suresi doldu). */
  pauseSignal?: number;
  pausedHint?: string;
  /** Oyun alaninin ustunde gosterilecek bilgi (orn. "Dinlenme bitti"). */
  banner?: ReactNode;
  /** Puan verildiginde (panel kapatilmis olsa bile) cagrilir; ust ekran puanini yenileyebilir. */
  onRewardGranted?: (result: MiniGameResult) => void;
  /** Oyun aktif olarak oynanirken true (ust ekran kaydirmayi kapatabilir). */
  onRunningChange?: (running: boolean) => void;
  /**
   * Verilirse yeni tur baslatilamaz (orn. dinlenme bitti): devam eden tur bitirilebilir, ama "Tekrar Oyna"
   * yerine bu eylem gosterilir ve henuz baslamamis oyun baslamaz.
   */
  replayBlocked?: { message: string; actionLabel: string; onAction: () => void } | null;
};

/**
 * Dumbbell Dash'in TEK ortak paneli: oyun alani + odul akisi + sonuc ozeti. Dinlenme ekrani ve MB FIT Puanim
 * ekrani ayni bileseni, ayni kurallari ve ayni odul sistemini kullanir.
 */
export function DumbbellDashPanel({
  subtitle,
  onClose,
  suspended,
  pauseSignal,
  pausedHint,
  banner,
  onRewardGranted,
  onRunningChange,
  replayBlocked = null,
}: Props) {
  const { colors } = useTheme();
  const { session, finish, prepareRound, submit } = useMiniGameRewards(onRewardGranted);
  const [round, setRound] = useState(0);

  useEffect(() => {
    prepareRound();
  }, [prepareRound]);

  const handleGameOver = useCallback((result: GameOverResult) => submit(result), [submit]);

  const handleReplay = useCallback(() => {
    setRound((value) => value + 1);
    prepareRound();
  }, [prepareRound]);

  const handleRetrySubmit = useCallback(() => {
    if (finish.kind === "failed") submit(finish.result);
  }, [finish, submit]);

  const ready = session.kind === "ready" ? session : null;
  const tiers = ready?.session?.rules.tiers ?? null;
  const notice = ready?.notice ?? null;

  return (
    <View testID="dumbbell-dash-panel" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.text }]}>Dumbbell Dash</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Oyunu kapat"
          style={[styles.iconButton, { backgroundColor: colors.inputBackground }]}
        >
          <Ionicons name="close" size={18} color={colors.text} />
        </Pressable>
      </View>

      {banner}

      <DumbbellDashGame
        // Her tur (ve seed belli oldugunda) yeni ornek: skor/durum sifirlanir, eski dongu temizlenir.
        key={`${round}-${ready?.seed ?? "pending"}`}
        seed={ready?.seed ?? 0}
        canStart={ready !== null && replayBlocked === null}
        readyHint={replayBlocked?.message}
        suspended={suspended}
        pauseSignal={pauseSignal}
        pausedHint={pausedHint}
        onGameOver={handleGameOver}
        onRunningChange={onRunningChange}
      />

      {finish.kind === "idle" ? (
        ready?.session && tiers ? (
          <RewardInfo
            tiers={tiers}
            remainingToday={ready.session.remainingToday}
            dailyPointLimit={ready.session.rules.dailyPointLimit}
          />
        ) : (
          <Text style={[styles.info, { color: colors.textSecondary }]}>
            {ready === null ? "Oyun hazırlanıyor…" : notice ?? ""}
          </Text>
        )
      ) : (
        <>
          <RoundSummary finish={finish} tiers={tiers} notice={notice} />
          <View style={styles.actions}>
            {finish.kind === "failed" ? (
              <ActionButton label="Tekrar Gönder" onPress={handleRetrySubmit} kind="secondary" />
            ) : null}
            {replayBlocked ? (
              <ActionButton label={replayBlocked.actionLabel} onPress={replayBlocked.onAction} kind="primary" />
            ) : (
              <ActionButton
                label="Tekrar Oyna"
                onPress={handleReplay}
                kind="primary"
                disabled={finish.kind === "submitting"}
              />
            )}
            <ActionButton label="Kapat" onPress={onClose} kind="secondary" />
          </View>
        </>
      )}
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  kind,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  kind: "primary" | "secondary";
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const primary = kind === "primary";
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: primary ? colors.text : colors.inputBackground, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[styles.actionLabel, { color: primary ? colors.background : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  titleBlock: { flex: 1 },
  title: { fontSize: 16, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2 },
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  info: { fontSize: 12, lineHeight: 17, textAlign: "center" },
  actions: { flexDirection: "row", gap: 8 },
  action: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  actionLabel: { fontSize: 14, fontWeight: "700" },
});
