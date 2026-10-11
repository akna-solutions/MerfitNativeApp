import { ProfileData } from "./types";

// GET /api/profile tamamlanana kadar (bkz. ProfileContext.tsx) veya kullanici cikis yapmisken
// kullanilan BOS durum. Burada gercekci gorunen hicbir deger (yas, kilo, antrenman gunleri,
// istatistik) TUTULMAZ: profil yuklenemezse ekran bunlari kullanicinin kendi verisiymis gibi
// gosterirdi. Ekranlar `isLoaded` false iken bu objeyi gostermez (bkz. ProfileScreen).
export const EMPTY_PROFILE_DATA: ProfileData = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  dateOfBirth: "",
  gender: "Belirtmek istemiyorum",

  age: 0,
  height: 0,
  weight: 0,
  targetWeight: 0,

  goal: "GENERAL_FITNESS",

  experienceLevel: "BEGINNER",
  equipment: "BODYWEIGHT",
  trainingLocation: null,
  workoutDurationMin: 0,
  trainingDaysPerWeek: 0,
  trainingDays: [],

  unitSystem: "metric",
  appearance: "system",

  // Backend'in, kullanici hic ayar kaydetmemisken dondurdugu varsayilanlarla ayni.
  notifications: {
    workoutReminders: true,
    dailyGoalReminder: true,
    streakReminder: true,
    progressUpdates: true,
    leaderboardUpdates: true,
    productUpdates: false,
  },
  privacy: {
    profileVisibleOnLeaderboard: true,
    shareWorkoutStatistics: true,
    personalizedRecommendations: true,
  },

  stats: {
    workouts: 0,
    streak: 0,
  },
};
