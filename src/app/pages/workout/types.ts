export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restSec: number;
  // Video dosyası projeye eklendiğinde require(...) sonucu (number) ya da
  // uzak bir URI (string) buraya konur. Henüz dosya yoksa null - bu durumda
  // ExerciseVideo görsel + "Egzersiz gösterimi" fallback gösterir.
  video: number | string | null;
  imageUrl: string;
  /** false ise vucut agirligi egzersizi: agirlik opsiyoneldir. */
  requiresWeight: boolean;
  /** En son tamamlanan oturumdaki setler (set sirasina gore); hic yapilmadiysa bos. */
  lastSets: { weight: number | null; reps: number | null }[];
  previousBest: { weight: number; reps: number } | null;
  /** Tekrar araliginin ust siniri (reps alt sinirdir); aralik yoksa null/undefined. */
  repsMax?: number | null;
  /** Bir sonraki hedef (cift progresyon): onerilen agirlik ve kullaniciya gosterilecek metin. */
  progression?: { message: string; suggestedWeightKg: number | null } | null;
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
