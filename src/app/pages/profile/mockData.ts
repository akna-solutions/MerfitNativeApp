import { ProfileData } from "./types";

// TODO: Backend/API + onboarding state bağlandığında bu mock objeyi
// gerçek kullanıcı verisiyle değiştir. Component'ler ProfileData şeklini
// beklediği için veri kaynağı değişse bile prop arayüzü aynı kalır.
export const MOCK_PROFILE_DATA: ProfileData = {
  firstName: "",
  username: "@",
  email: "",

  age: 31,
  height: 180,
  weight: 78.4,

  goal: "Kas Yapmak",
  goalDescription: "Güç ve kas kütlesi kazan",

  experience: "Başlangıç",
  activityLevel: "Orta",
  trainingDays: 4,
  workoutLocation: "Ev",
  equipment: ["Dambıl", "Direnç Bandı"],

  stats: {
    workouts: 18,
    streak: 12,
    weight: 78.4,
  },

  unitSystem: "metric",
};
