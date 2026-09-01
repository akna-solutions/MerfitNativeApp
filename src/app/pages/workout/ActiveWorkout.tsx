import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
import { getWorkoutSession, MOCK_PREVIOUS_BEST } from "./mockData";
import { colors } from "./theme";
import { ExerciseProgress, WorkoutPhase } from "./types";
import { WorkoutSummary } from "./WorkoutSummary";

type Props = {
  workoutId: string;
  workoutTitle?: string;
};

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ActiveWorkout({ workoutId, workoutTitle }: Props) {
  const router = useRouter();
  const session = useMemo(
    () => getWorkoutSession(workoutId, workoutTitle),
    [workoutId, workoutTitle],
  );

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [phase, setPhase] = useState<WorkoutPhase>("exercise");
  const [progress, setProgress] = useState<Record<string, ExerciseProgress>>(
    () =>
      Object.fromEntries(
        session.exercises.map((ex) => [
          ex.id,
          { currentSet: 1, completedSets: [] },
        ]),
      ),
  );
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [restRemaining, setRestRemaining] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  const phaseBeforePause = useRef<WorkoutPhase>("exercise");
  const pendingAdvanceExercise = useRef(false);
  const restTotalSec = useRef(0);

  const currentExercise = session.exercises[exerciseIndex];
  const currentProgress = progress[currentExercise?.id ?? ""];

  // Bir sonraki set için varsayılan reps değeri egzersizin hedef rep sayısı;
  // kullanıcı egzersiz değiştiğinde alanlar sıfırlanır.
  useEffect(() => {
    if (!currentExercise) return;
    setRepsInput(`${currentExercise.reps}`);
    setWeightInput("");
  }, [currentExercise?.id]);

  // Toplam antrenman süresi - paused/complete/summary dışında her saniye artar.
  useEffect(() => {
    if (phase === "paused" || phase === "complete" || phase === "summary")
      return;
    const interval = setInterval(() => setElapsedSec((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Rest timer - sadece phase === 'rest' iken çalışır, unmount/phase
  // değişiminde temizlenir. Interval sadece phase'e bağlı - restRemaining
  // her saniye değiştiğinde interval'ı yeniden kurmuyoruz.
  useEffect(() => {
    if (phase !== "rest") return;
    const interval = setInterval(() => {
      setRestRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // restRemaining 0'a ulaştığında (ve hâlâ rest fazındaysak) bir sonraki
  // adıma geç - bu ayrı effect sayesinde geçiş sadece bir kez tetikleniyor.
  useEffect(() => {
    if (phase === "rest" && restRemaining === 0) {
      handleRestEnd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, restRemaining]);

  if (!currentExercise || !currentProgress) return null;

  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const totalCompletedSets = Object.values(progress).reduce(
    (sum, item) => sum + item.completedSets.length,
    0,
  );

  function handleCompleteSet() {
    const weight = parseFloat(weightInput) || 0;
    const reps = parseInt(repsInput, 10) || currentExercise.reps;

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
    // TODO: workout progress'i (exerciseIndex, progress, elapsedSec)
    // AsyncStorage veya backend'e kaydet ki kullanıcı devam edebilsin.
    setExitModalVisible(false);
    router.back();
  }

  const personalRecords = session.exercises
    .map((exercise) => {
      const best = MOCK_PREVIOUS_BEST[exercise.id];
      const sets = progress[exercise.id]?.completedSets ?? [];
      if (!best || sets.length === 0) return null;
      const topSet = sets.reduce((a, b) => (b.weight > a.weight ? b : a));
      if (topSet.weight > best.weight) {
        return {
          exerciseName: exercise.name,
          weight: topSet.weight,
          reps: topSet.reps,
        };
      }
      return null;
    })
    .filter(
      (item): item is { exerciseName: string; weight: number; reps: number } =>
        Boolean(item),
    );

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
    <View style={styles.root}>
      <StatusBar style="light" />
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
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 6 },
  progressGap: { marginTop: 16 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  footer: { paddingHorizontal: 24, paddingBottom: 10, paddingTop: 8 },
});
