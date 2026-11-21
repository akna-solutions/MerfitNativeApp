import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "../../../services/api/client";
import {
  acceptTrainingProposal,
  askTrainingCoach,
  generateTrainingProgram,
  getActiveTrainingProgram,
  getTrainingPreferences,
  getTrainingProgram,
  getTrainingProgress,
  getTrainingUpdateRecommendation,
  proposeTrainingUpdate,
  rejectTrainingProposal,
  swapTrainingExercise,
} from "../../../services/api/training";
import {
  TrainingCoachResponse,
  TrainingCoachTopic,
  TrainingDay,
  TrainingExercise,
  TrainingPreferences,
  TrainingProgram,
  TrainingProgress,
  TrainingUpdateRecommendation,
} from "../../../services/api/types";
import { DumbbellSpinner } from "../../../shared/motion/DumbbellSpinner";
import { formatSets, programSubtitle } from "../../../shared/training/format";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { activeWorkoutParams } from "../../../shared/workout/planDays";
import { GenerateForm } from "./components/GenerateForm";
import { ProgramDayCard } from "./components/ProgramDayCard";
import { ProgressSection } from "./components/ProgressSection";

type State = {
  active: TrainingProgram | null;
  proposal: TrainingProgram | null;
  recommendation: TrainingUpdateRecommendation | null;
  progress: TrainingProgress | null;
  preferences: TrainingPreferences | null;
};

const EMPTY: State = { active: null, proposal: null, recommendation: null, progress: null, preferences: null };

function errorText(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

/**
 * Kisisel antrenman programi: olusturma, aktif versiyon, onay bekleyen yeni versiyon (degisiklikler ve
 * gerekceleriyle), egzersiz alternatifi, gelisim ozeti ve dogrulanmis AI aciklamasi.
 */
export default function TrainingProgramScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [state, setState] = useState<State>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [coach, setCoach] = useState<TrainingCoachResponse | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoadError(null);
      try {
        const [active, recommendation, progress, preferences] = await Promise.all([
          getActiveTrainingProgram(signal),
          getTrainingUpdateRecommendation(signal).catch(() => null),
          getTrainingProgress(signal).catch(() => null),
          getTrainingPreferences(signal).catch(() => null),
        ]);
        const proposal = recommendation?.pendingProposalId
          ? await getTrainingProgram(recommendation.pendingProposalId, signal).catch(() => null)
          : null;
        setState({ active, proposal, recommendation, progress, preferences });
      } catch (error) {
        if (signal?.aborted) return;
        if (error instanceof ApiError && error.isUnauthorized) {
          router.replace("/pages/login");
          return;
        }
        setLoadError(errorText(error, "Programın yüklenemedi."));
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      load(controller.signal);
      return () => controller.abort();
    }, [load]),
  );

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setActionError(null);
    try {
      await action();
    } catch (error) {
      setActionError(errorText(error, "İşlem tamamlanamadı."));
    } finally {
      setBusy(null);
    }
  }

  const generate = (request: TrainingPreferences) =>
    run("generate", async () => {
      const program = await generateTrainingProgram(request);
      setShowForm(false);
      if (program.status === "Proposed") {
        setState((prev) => ({ ...prev, proposal: program }));
      }
      await load();
    });

  const propose = () =>
    run("propose", async () => {
      const program = await proposeTrainingUpdate();
      setState((prev) => ({ ...prev, proposal: program }));
    });

  const accept = (program: TrainingProgram) =>
    run("accept", async () => {
      await acceptTrainingProposal(program.id);
      await load();
    });

  const reject = (program: TrainingProgram) =>
    run("reject", async () => {
      await rejectTrainingProposal(program.id);
      setState((prev) => ({ ...prev, proposal: null }));
      await load();
    });

  const swap = (exercise: TrainingExercise, newExerciseId: number, newName: string) => {
    Alert.alert(
      "Egzersizi değiştir",
      `${exercise.name} yerine ${newName} gelsin mi? Programın yeni bir versiyonu oluşur; tamamladığın antrenmanlar korunur.`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Değiştir",
          onPress: () =>
            run("swap", async () => {
              await swapTrainingExercise(exercise.planExerciseId, newExerciseId);
              await load();
            }),
        },
      ],
    );
  };

  const startDay = (day: TrainingDay) => {
    const params = activeWorkoutParams({ id: null, title: day.title }, day.workoutPlanDayId);
    if (params) router.push({ pathname: "/pages/workout/active/[id]", params } as never);
  };

  const askCoach = (topic: TrainingCoachTopic) =>
    run(`coach-${topic}`, async () => {
      setCoach(await askTrainingCoach(topic));
    });

  const { active, proposal, recommendation, progress, preferences } = state;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/pages/dashboard"))}
            hitSlop={12}
            style={[styles.back, { backgroundColor: colors.inputBackground }]}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Kişisel Program</Text>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <DumbbellSpinner color={colors.primary} size="large" />
          </View>
        ) : loadError ? (
          <View style={styles.centered}>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>{loadError}</Text>
            <Pressable
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => {
                setIsLoading(true);
                load();
              }}
            >
              <Text style={styles.buttonLabel}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {actionError ? <Text style={[styles.error, { color: colors.danger }]}>{actionError}</Text> : null}

            {!active || showForm ? (
              <GenerateForm
                initial={preferences}
                hasActiveProgram={!!active}
                isSubmitting={busy === "generate"}
                error={null}
                onSubmit={generate}
                onCancel={active ? () => setShowForm(false) : undefined}
              />
            ) : null}

            {proposal ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <Text style={[styles.badge, { color: colors.primary }]}>ONAY BEKLİYOR · V{proposal.version}</Text>
                <Text style={[styles.title, { color: colors.text }]}>{proposal.name}</Text>
                <Text style={[styles.muted, styles.left, { color: colors.textSecondary }]}>{programSubtitle(proposal)}</Text>
                <Text style={[styles.section, { color: colors.textSecondary }]}>Ne değişti, neden?</Text>
                {proposal.changes.map((change, index) => (
                  <Text key={`${change.type}-${index}`} style={[styles.change, { color: colors.text }]}>
                    • {change.message}
                  </Text>
                ))}
                <Text style={[styles.note, { color: colors.textSecondary }]}>
                  Onaylayana kadar mevcut programın aynen devam eder. Eski versiyon ve geçmişin silinmez.
                </Text>
                {proposal.days.map((day) => (
                  <ProgramDayCard key={day.workoutPlanDayId} day={day} editable={false} />
                ))}
                <View style={styles.row}>
                  <Pressable
                    disabled={!!busy}
                    style={[styles.button, styles.flex, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}
                    onPress={() => accept(proposal)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.buttonLabel}>{busy === "accept" ? "Onaylanıyor..." : "Onayla"}</Text>
                  </Pressable>
                  <Pressable
                    disabled={!!busy}
                    style={[styles.button, styles.flex, { backgroundColor: colors.inputBackground }]}
                    onPress={() => reject(proposal)}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.buttonLabel, { color: colors.text }]}>Reddet</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {active ? (
              <>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.badge, { color: colors.textSecondary }]}>
                    AKTİF · V{active.version}
                    {active.source === "Manual" ? " · ELLE DÜZENLENDİ" : ""}
                  </Text>
                  <Text style={[styles.title, { color: colors.text }]}>{active.name}</Text>
                  <Text style={[styles.muted, styles.left, { color: colors.textSecondary }]}>{programSubtitle(active)}</Text>
                  {active.splitReasons.map((reason) => (
                    <Text key={reason} style={[styles.note, { color: colors.textSecondary }]}>
                      {reason}
                    </Text>
                  ))}
                  {active.notes.map((note) => (
                    <Text key={note} style={[styles.note, { color: colors.textSecondary }]}>
                      {note}
                    </Text>
                  ))}
                  <View style={styles.row}>
                    <Pressable
                      style={[styles.smallButton, { backgroundColor: colors.inputBackground }]}
                      onPress={() => setShowForm(true)}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.smallLabel, { color: colors.text }]}>Tercihleri değiştir</Text>
                    </Pressable>
                    <Pressable
                      disabled={!!busy}
                      style={[styles.smallButton, { backgroundColor: colors.inputBackground }]}
                      onPress={() => askCoach("program")}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.smallLabel, { color: colors.text }]}>
                        {busy === "coach-program" ? "Hazırlanıyor..." : "Programımı açıkla"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {recommendation?.isUpdateRecommended && !proposal ? (
                  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                    <Text style={[styles.title, { color: colors.text }]}>Programını güncelleme zamanı</Text>
                    {recommendation.reasons.map((reason) => (
                      <Text key={reason} style={[styles.change, { color: colors.text }]}>
                        • {reason}
                      </Text>
                    ))}
                    <Pressable
                      disabled={!!busy}
                      style={[styles.button, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}
                      onPress={propose}
                      accessibilityRole="button"
                    >
                      <Text style={styles.buttonLabel}>{busy === "propose" ? "Hazırlanıyor..." : "Yeni versiyonu gör"}</Text>
                    </Pressable>
                  </View>
                ) : !proposal ? (
                  <Pressable onPress={propose} disabled={!!busy} style={styles.linkRow} accessibilityRole="button">
                    <Text style={[styles.link, { color: colors.primary }]}>
                      {busy === "propose" ? "Hazırlanıyor..." : "Geçmişime göre yeni versiyon öner"}
                    </Text>
                  </Pressable>
                ) : null}

                {coach ? (
                  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.badge, { color: colors.textSecondary }]}>
                      {coach.source === "ai" ? "AI KOÇ · VERİTABANINA GÖRE DOĞRULANDI" : "KOÇ NOTU"}
                    </Text>
                    <Text style={[styles.change, { color: colors.text }]}>{coach.message}</Text>
                  </View>
                ) : null}

                {active.days.map((day, index) => (
                  <ProgramDayCard
                    key={day.workoutPlanDayId}
                    day={day}
                    editable
                    initiallyExpanded={index === 0}
                    onStart={startDay}
                    onSwap={swap}
                  />
                ))}

                {active.weeklyVolume.length > 0 ? (
                  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.title, { color: colors.text }]}>Haftalık set (kas grubu)</Text>
                    {active.weeklyVolume.map((v) => (
                      <View key={v.region} style={styles.volumeRow}>
                        <Text style={[styles.volumeLabel, { color: colors.text }]}>{v.label}</Text>
                        <Text style={[styles.volumeValue, { color: colors.textSecondary }]}>
                          {formatSets(v.totalSets)} set
                          {v.indirectSets > 0 ? ` (${formatSets(v.indirectSets)} yardımcı)` : ""}
                        </Text>
                      </View>
                    ))}
                    <Text style={[styles.note, { color: colors.textSecondary }]}>
                      Yardımcı kas olarak çalışan setler yarım set sayılır.
                    </Text>
                  </View>
                ) : null}

                <ProgressSection progress={progress} recovery={recommendation?.recovery ?? null} />
                {progress && progress.completedSessions12Weeks > 0 ? (
                  <Pressable onPress={() => askCoach("progress")} disabled={!!busy} style={styles.linkRow} accessibilityRole="button">
                    <Text style={[styles.link, { color: colors.primary }]}>
                      {busy === "coach-progress" ? "Hazırlanıyor..." : "Gelişimimi açıkla"}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 8 },
  badge: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  title: { fontSize: 16, fontWeight: "700" },
  section: { fontSize: 12, fontWeight: "700", marginTop: 4 },
  change: { fontSize: 13, lineHeight: 19 },
  muted: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  left: { textAlign: "left" },
  note: { fontSize: 12, lineHeight: 17 },
  error: { fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", gap: 8, marginTop: 4 },
  flex: { flex: 1 },
  button: { height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  buttonLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  smallButton: { flex: 1, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  smallLabel: { fontSize: 12, fontWeight: "700" },
  linkRow: { alignItems: "center", paddingVertical: 6 },
  link: { fontSize: 13, fontWeight: "700" },
  volumeRow: { flexDirection: "row", justifyContent: "space-between" },
  volumeLabel: { fontSize: 13, fontWeight: "600" },
  volumeValue: { fontSize: 12 },
});
