import { ProfileData } from "./types";

// GET /api/profile tamamlanana kadar (ProfileProvider bkz. ProfileContext.tsx) veya kullanici
// cikis yapmisken gosterilen gecici varsayilan durum. Kimlik alanlari (firstName/username/email)
// BILINCLI OLARAK BOS BIRAKILIR - sabit/gercekci gorunen bir isim (orn. "Mert") burada durursa,
// profil yuklemesi basarisiz oldugunda veya geciktiginde kullaniciya BASKA BIR KISININ gercek
// verisiymis gibi gorunebilir (bkz. Faz raporu - hard-coded kullanici bilgisi bug'i).
export const INITIAL_PROFILE_DATA: ProfileData = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  dateOfBirth: "1994-03-12",
  gender: "Erkek",

  age: 31,
  height: 180,
  weight: 78,
  targetWeight: 75,

  goal: "BUILD_MUSCLE",

  experienceLevel: "INTERMEDIATE",
  equipment: "FULL_GYM",
  workoutDurationMin: 60,
  trainingDays: ["Mon", "Tue", "Thu", "Fri"],

  unitSystem: "metric",
  appearance: "system",

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
    workouts: 18,
    streak: 12,
  },
};
