import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "../../../services/api/client";
import { WorkoutSession as ApiWorkoutSession } from "../../../services/api/types";
import {
    cancelWorkoutSession,
    completeWorkoutSession,
    logWorkoutSet,
    startWorkoutSession,
} from "../../../services/api/workoutSessions";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { ExerciseInfo } from "./components/ExerciseInfo";
import { ExerciseVideo } from "./components/ExerciseVideo";
import { ExitWorkoutModal } from "./components/ExitWorkoutModal";
import { PauseOverlay } from "./components/PauseOverlay";
import { RestTimer } from "./components/RestTimer";
import { SetInput } from "./components/SetInput";
import { SetTracker } from "./components/SetTracker";
import { WorkoutComplete } from "./components/WorkoutComplete";
import { WorkoutProgress } from "./components/WorkoutProgress";
import { WorkoutTopBar } from "./components/WorkoutTopBar";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { Exercise, ExerciseProgress, WorkoutPhase, WorkoutSession } from "./types";
import { WorkoutSummary } from "./WorkoutSummary";

type Props = {
  workoutId: string;
  workoutTitle?: string;
  /** Kisisel plandan ("Bugünün Antrenmanı") baslatildiysa dolu gelir; hedef set/tekrar
   * degerlerinin genel katalog yerine kisisel WorkoutPlanExercise'dan okunmasini saglar. */
  workoutPlanDayId?: string;
};

type PersonalRecord = { exerciseName: string; weight: number; reps: number };

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Backend'in CustomerWorkoutSessionDto'sunu (services/api/types.ts) ekranin WorkoutSession sekline cevirir. */
function mapApiSession(api: ApiWorkoutSession): {
  session: WorkoutSession;
  previousBest: Record<string, { weight: number; reps: number }>;
} {
  const previousBest: Record<string, { weight: number; reps: number }> = {};

  const exercises: Exercise[] = api.exercises.map((ex) => {
    // sessionExerciseId'yi string id olarak kullanıyoruz; set loglarken
    // Number(exercise.id) ile geri backend'in beklediği kimliğe dönüyoruz.
    const id = String(ex.sessionExerciseId);
    if (ex.previousBest) {
      previousBest[id] = { weight: ex.previousBest.weightKg, reps: ex.previousBest.reps };
    }
    return {
      id,
      name: ex.name,
      sets: ex.targetSets || 1,
      reps: ex.targetReps ?? 10,
      restSec: ex.restSeconds ?? 60,
      video: ex.videoUrl,
      imageUrl: ex.imageUrl ?? "",
    };
  });

  return {
    session: { id: String(api.id), title: api.title, exercises },
    previousBest,
  };
}

export function ActiveWorkout({ workoutId, workoutTitle, workoutPlanDayId }: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [phase, setPhase] = useState<WorkoutPhase>("exercise");
  const [progress, setProgress] = useState<Record<string, ExerciseProgress>>({});
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [restRemaining, setRestRemaining] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  const phaseBeforePause = useRef<WorkoutPhase>("exercise");
  const pendingAdvanceExercise = useRef(false);
  const restTotalSec = useRef(0);
  const hasCompletedOnServer = useRef(false);

  // Antrenmani baslat: workoutId'ye karsilik gelen Workout icin backend'de
  // yeni bir WorkoutSession olusturur ve egzersiz/set sablonunu getirir.
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const numericWorkoutId = Number(workoutId);
        const numericPlanDayId = workoutPlanDayId ? Number(workoutPlanDayId) : undefined;
        const apiSession = await startWorkoutSession(numericWorkoutId, numericPlanDayId);
        if (!isMounted) return;

        const { session: mapped } = mapApiSession(apiSession);
        setSessionId(apiSession.id);
        setSession(mapped);
        setProgress(
          Object.fromEntries(
            mapped.exercises.map((ex) => [ex.id, { currentSet: 1, completedSets: [] }]),
          ),
        );
      } catch (error) {
        if (!isMounted) return;
        if (error instanceof ApiError && error.isUnauthorized) {
          router.replace("/pages/login");
          return;
        }
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "Antrenman başlatılamadı. Lütfen tekrar deneyin.",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [workoutId, workoutPlanDayId, router]);

  const currentExercise = session?.exercises[exerciseIndex];
  const currentProgress = currentExercise ? progress[currentExercise.id] : undefined;

  useEffect(() => {
    if (!currentExercise) return;
    setRepsInput(`${currentExercise.reps}`);
    setWeightInput("");
  }, [currentExercise?.id]);

  useEffect(() => {
    if (phase === "paused" || phase === "complete" || phase === "summary" || !session)
      return;
    const interval = setInterval(() => setElapsedSec((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [phase, session]);

  useEffect(() => {
    if (phase !== "rest") return;
    const interval = setInterval(() => {
      setRestRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === "rest" && restRemaining === 0) {
      handleRestEnd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, restRemaining]);

  // Oturum tamamlandiginda (phase === "complete") backend'e bir kez bildir:
  // seri/kisisel rekor hesaplamasi orada yapilir, sonuc summary ekraninda kullanilir.
  useEffect(() => {
    if (phase !== "complete" || !sessionId || hasCompletedOnServer.current) return;
    hasCompletedOnServer.current = true;

    completeWorkoutSession(sessionId, { durationSeconds: elapsedSec })
      .then((summary) => {
        setPersonalRecords(
          summary.newPersonalRecords.map((pr) => ({
            exerciseName: pr.exerciseName,
            weight: pr.weightKg,
            reps: pr.reps,
          })),
        );
      })
      .catch((error) => {
        if (error instanceof ApiError && error.isUnauthorized) {
          router.replace("/pages/login");
          return;
        }
        Alert.alert(
          "Antrenman kaydedilemedi",
          error instanceof ApiError
            ? error.message
            : "Sonuçlar sunucuya kaydedilirken bir sorun oluştu.",
        );
      });
  }, [phase, sessionId, elapsedSec, router]);

  if (isLoading) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (loadError || !session || !currentExercise || !currentProgress || !sessionId) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {loadError ?? "Antrenman verisi yüklenemedi."}
        </Text>
        <Text style={[styles.retryLabel, { color: colors.primary }]} onPress={() => router.back()}>
          Geri dön
        </Text>
      </View>
    );
  }

  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const totalCompletedSets = Object.values(progress).reduce(
    (sum, item) => sum + item.completedSets.length,
    0,
  );

  function handleCompleteSet() {
    if (!currentExercise || !currentProgress || !sessionId) return;

    const weight = parseFloat(weightInput) || 0;
    const reps = parseInt(repsInput, 10) || currentExercise.reps;
    const setNumber = currentProgress.currentSet;

    setProgress((prev) => {
      const entry = prev[currentExercise.id];
      return {
        ...prev,
        [currentExercise.id]: {
          ...entry,
          completedSets: [...entry.completedSets, { weight, reps }],
        },
      };
    });

    // Seti sunucuya kaydet (arka planda) - kullanıcı akışını bloklamıyoruz,
    // hata olursa sessizce bildiriyoruz ki antrenman akışı kesilmesin.
    logWorkoutSet(sessionId, Number(currentExercise.id), {
      setNumber,
      weightKg: weight > 0 ? weight : null,
      reps,
    }).catch((error) => {
      if (error instanceof ApiError && error.isUnauthorized) {
        router.replace("/pages/login");
        return;
      }
      Alert.alert(
        "Set kaydedilemedi",
        "Bu set sunucuya kaydedilemedi, antrenmana devam edebilirsiniz.",
      );
    });

    const isLastSetOfExercise =
      currentProgress.completedSets.length + 1 >= currentExercise.sets;
    const isLastExercise = exerciseIndex >= session.exercises.length - 1;

    if (isLastSetOfExercise && isLastExercise) {
      setPhase("complete");
      return;
    }

    pendingAdvanceExercise.current = isLastSetOfExercise;
    restTotalSec.current = currentExercise.restSec;
    setRestRemaining(currentExercise.restSec);
    setPhase("rest");
  }

  function handleRestEnd() {
    if (!currentExercise) return;
    if (pendingAdvanceExercise.current) {
      pendingAdvanceExercise.current = false;
      setExerciseIndex((prev) => prev + 1);
    } else {
      setProgress((prev) => ({
        ...prev,
        [currentExercise.id]: {
          ...prev[currentExercise.id],
          currentSet: prev[currentExercise.id].currentSet + 1,
        },
      }));
    }
    setPhase("exercise");
  }

  function handleAdjustRest(deltaSec: number) {
    setRestRemaining((prev) => Math.max(0, prev + deltaSec));
  }

  function handlePause() {
    phaseBeforePause.current = phase;
    setPhase("paused");
  }

  function handleResume() {
    setPhase(phaseBeforePause.current);
  }

  function handleRequestExit() {
    phaseBeforePause.current =
      phase === "paused" ? phaseBeforePause.current : phase;
    setExitModalVisible(true);
  }

  function handleSaveAndExit() {
    setExitModalVisible(false);
    if (sessionId) {
      // Backend henuz "devam et" (resume) akisini desteklemedigi icin erken
      // cikis oturumu "yarim birakildi" (Abandoned) olarak isaretler.
      cancelWorkoutSession(sessionId).catch(() => {
        // Sessizce yut - kullanici zaten ekrandan cikiyor.
      });
    }
    router.back();
  }

  if (phase === "summary") {
    return (
      <WorkoutSummary
        title={session.title}
        durationLabel={formatDuration(elapsedSec)}
        exercises={session.exercises}
        progress={progress}
        personalRecords={personalRecords}
        onDone={() => router.replace("/pages/progress")}
      />
    );
  }

  if (phase === "complete") {
    return (
      <WorkoutComplete
        durationLabel={formatDuration(elapsedSec)}
        exerciseCount={session.exercises.length}
        setCount={totalCompletedSets}
        onViewSummary={() => setPhase("summary")}
        onDone={() => router.replace("/pages/workouts")}
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <WorkoutTopBar
              title={session.title}
              exerciseIndex={exerciseIndex}
              totalExercises={session.exercises.length}
              onClose={handleRequestExit}
              onPause={handlePause}
            />
            <View style={styles.progressGap}>
              <WorkoutProgress
                current={exerciseIndex}
                total={session.exercises.length}
              />
            </View>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {phase === "rest" ? (
              <RestTimer
                remainingSec={restRemaining}
                totalSec={restTotalSec.current}
                nextExercise={
                  pendingAdvanceExercise.current
                    ? (session.exercises[exerciseIndex + 1] ?? null)
                    : null
                }
                onAdjust={handleAdjustRest}
                onSkip={handleRestEnd}
              />
            ) : (
              <>
                <ExerciseVideo
                  video={currentExercise.video}
                  imageUrl={currentExercise.imageUrl}
                />
                <ExerciseInfo
                  name={currentExercise.name}
                  sets={currentExercise.sets}
                  reps={currentExercise.reps}
                  restSec={currentExercise.restSec}
                />
                <SetTracker
                  totalSets={currentExercise.sets}
                  currentSet={currentProgress.currentSet}
                  completedCount={currentProgress.completedSets.length}
                />
                <SetInput
                  setNumber={currentProgress.currentSet}
                  totalSets={currentExercise.sets}
                  weight={weightInput}
                  onWeightChange={setWeightInput}
                  reps={repsInput}
                  onRepsChange={setRepsInput}
                />
              </>
            )}
          </ScrollView>

          {phase === "exercise" ? (
            <View style={styles.footer}>
              <OnboardingButton
                label="Seti Tamamla"
                onPress={handleCompleteSet}
              />
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {phase === "paused" ? (
        <PauseOverlay onResume={handleResume} onExit={handleRequestExit} />
      ) : null}

      <ExitWorkoutModal
        visible={exitModalVisible}
        onContinue={() => setExitModalVisible(false)}
        onSaveAndExit={handleSaveAndExit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  errorText: { fontSize: 14, textAlign: "center" },
  retryLabel: { fontSize: 13, fontWeight: "700" },
  header: { paddingHorizontal: 20, paddingTop: 6 },
  progressGap: { marginTop: 16 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  footer: { paddingHorizontal: 24, paddingBottom: 10, paddingTop: 8 },
});
