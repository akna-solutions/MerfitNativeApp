import { DashboardData } from "./types";

// TODO: Backend/API bağlandığında bu mock objeyi gerçek fetch/query
// sonucuyla değiştir. Component'ler DashboardData şeklini beklediği için
// veri kaynağı değişse bile prop arayüzü aynı kalır.
export const MOCK_DASHBOARD_DATA: DashboardData = {
  userName: "Mert",
  hasCompletedFirstWorkout: true,
  todayProgress: {
    workoutsCompleted: 3,
    workoutsTarget: 5,
    calories: 420,
    steps: 6240,
    sleepHours: 7.3,
  },
  todayWorkout: {
    id: "upper-body-strength",
    title: "Upper Body Strength",
    duration: "45 min",
    meta: "6 exercises",
    difficulty: "Intermediate",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=60",
  },
  quickStats: [
    { id: "weight", label: "Weight", value: "78.4 kg", icon: "scale" },
    { id: "streak", label: "Streak", value: "12 days", icon: "flame" },
    { id: "calories", label: "Calories", value: "420 kcal", icon: "trophy" },
    {
      id: "workouts",
      label: "This week",
      value: "3 workouts",
      icon: "barbell",
    },
  ],
  goalProgress: {
    currentWeightKg: 78.4,
    goalWeightKg: 75,
    startWeightKg: 84,
  },
  recommended: [
    {
      id: "full-body-burn",
      title: "Full Body Burn",
      duration: "35 min",
      meta: "Intermediate",
      difficulty: "Intermediate",
      imageUrl:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=60",
    },
    {
      id: "core-stability",
      title: "Core Stability",
      duration: "20 min",
      meta: "Beginner",
      difficulty: "Beginner",
      imageUrl:
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=60",
    },
    {
      id: "leg-day",
      title: "Leg Day Power",
      duration: "50 min",
      meta: "Advanced",
      difficulty: "Advanced",
      imageUrl:
        "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=60",
    },
  ],
};
