import { ProfileData } from "./types";

// TODO: Backend/API + onboarding state bağlandığında bu mock objenin
// yerine gerçek kullanıcı kaydı gelecek. Component'ler ProfileData
// şeklini beklediği için arayüz aynı kalır.
export const INITIAL_PROFILE_DATA: ProfileData = {
  firstName: "Mert",
  lastName: "",
  username: "mert",
  email: "user@example.com",
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
  appearance: "dark",

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
