import { ProfileData } from "./types";

// TODO: Backend/API + onboarding state bağlandığında bu mock objeyi
// gerçek kullanıcı verisiyle değiştir. Component'ler ProfileData şeklini
// beklediği için veri kaynağı değişse bile prop arayüzü aynı kalır.
export const MOCK_PROFILE_DATA: ProfileData = {
  firstName: "Mert",
  username: "@mert",
  email: "mert@example.com",

  age: 31,
  height: 180,
  weight: 78.4,

  goal: "Build Muscle",
  goalDescription: "Build strength & muscle mass",

  experience: "Beginner",
  activityLevel: "Moderate",
  trainingDays: 4,
  workoutLocation: "Home",
  equipment: ["Dumbbells", "Resistance Bands"],

  stats: {
    workouts: 18,
    streak: 12,
    weight: 78.4,
  },

  unitSystem: "metric",
};
