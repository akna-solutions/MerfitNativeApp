import { Exercise, WorkoutSession } from "./types";

// TODO: Backend/API bağlandığında bu mock session'ları gerçek workout
// plan verisiyle değiştir. Video dosyaları projeye eklenene kadar hepsi
// `video: null` - ExerciseVideo bunu görsel + placeholder olarak gösteriyor.
const IMAGES = [
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=60",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=60",
  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=60",
  "https://images.unsplash.com/photo-1585152968992-d2b9444408cc?auto=format&fit=crop&w=900&q=60",
];

function exercise(
  id: string,
  name: string,
  sets: number,
  reps: number,
  restSec: number,
  imageIndex: number,
): Exercise {
  return {
    id,
    name,
    sets,
    reps,
    restSec,
    video: null,
    imageUrl: IMAGES[imageIndex % IMAGES.length],
  };
}

export const MOCK_WORKOUT_SESSIONS: Record<string, WorkoutSession> = {
  "full-body-strength": {
    id: "full-body-strength",
    title: "Tüm Vücut Kuvveti",
    exercises: [
      exercise("squat", "Halter Squat", 3, 10, 60, 0),
      exercise("lunges", "Yürüyerek Hamle", 3, 12, 60, 1),
      exercise("bench-press", "Bench Press", 3, 10, 90, 2),
      exercise("plank", "Plank", 3, 30, 45, 3),
    ],
  },
  "upper-body-power": {
    id: "upper-body-power",
    title: "Üst Vücut Gücü",
    exercises: [
      exercise("bench-press", "Bench Press", 4, 8, 90, 2),
      exercise("overhead-press", "Omuz Press", 3, 10, 75, 1),
      exercise("bent-row", "Eğilerek Kürek Çekme", 3, 10, 75, 0),
    ],
  },
  "quick-hiit": {
    id: "quick-hiit",
    title: "Hızlı HIIT",
    exercises: [
      exercise("jump-squat", "Sıçramalı Squat", 4, 15, 30, 0),
      exercise("mountain-climbers", "Dağcı Hareketi", 4, 20, 30, 3),
      exercise("burpees", "Burpee", 4, 12, 45, 1),
    ],
  },
};

// Eşleşen bir mock session yoksa (ör. dashboard'daki "Today's Workout")
// uygulamanın kırılmaması için jenerik bir fallback session döner.
const DEFAULT_EXERCISES: Exercise[] = [
  exercise("squat", "Halter Squat", 3, 10, 60, 0),
  exercise("lunges", "Yürüyerek Hamle", 3, 12, 60, 1),
  exercise("bench-press", "Bench Press", 3, 10, 90, 2),
];

export function getWorkoutSession(id: string, title?: string): WorkoutSession {
  const found = MOCK_WORKOUT_SESSIONS[id];
  if (found) return found;
  return {
    id,
    title: title ?? "Antrenman",
    exercises: DEFAULT_EXERCISES,
  };
}

// Kullanıcının bir önceki en iyi performansı - Workout Summary'de
// "NEW PR" rozetini tetiklemek için kullanılıyor.
export const MOCK_PREVIOUS_BEST: Record<
  string,
  { weight: number; reps: number }
> = {
  squat: { weight: 80, reps: 8 },
  "bench-press": { weight: 60, reps: 8 },
};
