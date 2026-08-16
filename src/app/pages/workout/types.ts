export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restSec: number;
  // Video dosyası projeye eklendiğinde require(...) sonucu (number) ya da
  // uzak bir URI (string) buraya konur. Henüz dosya yoksa null - bu durumda
  // ExerciseVideo görsel + "Exercise demonstration" fallback gösterir.
  video: number | string | null;
  imageUrl: string;
};

export type WorkoutSession = {
  id: string;
  title: string;
  exercises: Exercise[];
};

export type SetLog = {
  weight: number;
  reps: number;
};

export type ExerciseProgress = {
  currentSet: number; // 1-indexed
  completedSets: SetLog[];
};

export type WorkoutPhase =
  | "exercise"
  | "rest"
  | "paused"
  | "complete"
  | "summary";
