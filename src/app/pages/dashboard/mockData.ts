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
  },
  todayWorkout: {
    id: "upper-body-strength",
    title: "Üst Vücut Kuvveti",
    duration: "45 dk",
    meta: "6 egzersiz",
    difficulty: "Orta",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=60",
  },
  quickStats: [
    { id: "weight", label: "Kilo", value: "78.4 kg", icon: "scale" },
    { id: "streak", label: "Seri", value: "12 gün", icon: "flame" },
    { id: "calories", label: "Kalori", value: "420 kcal", icon: "trophy" },
    {
      id: "workouts",
      label: "Bu hafta",
      value: "3 antrenman",
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
      title: "Tüm Vücut Yakımı",
      duration: "35 dk",
      meta: "Orta",
      difficulty: "Orta",
      imageUrl:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=60",
    },
    {
      id: "core-stability",
      title: "Core Stabilizasyonu",
      duration: "20 dk",
      meta: "Başlangıç",
      difficulty: "Başlangıç",
      imageUrl:
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=60",
    },
    {
      id: "leg-day",
      title: "Bacak Günü Gücü",
      duration: "50 dk",
      meta: "İleri",
      difficulty: "İleri",
      imageUrl:
        "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=60",
    },
  ],
};
