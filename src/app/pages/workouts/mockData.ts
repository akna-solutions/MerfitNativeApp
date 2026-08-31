import { Workout } from "./types";

// TODO: Backend/API bağlandığında bu mock listeyi gerçek fetch/query
// sonucuyla değiştir. Component'ler Workout[] şeklini beklediği için
// veri kaynağı değişse bile arayüz aynı kalır.
export const MOCK_WORKOUTS: Workout[] = [
  {
    id: "full-body-strength",
    title: "Tüm Vücut Kuvveti",
    tagline: "Her yerde güç kazan.",
    duration: 45,
    difficulty: "Orta",
    category: "Kuvvet",
    muscleGroup: "Tüm Vücut",
    equipment: ["Dambıl", "Halter"],
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=60",
    featured: true,
  },
  {
    id: "upper-body-power",
    title: "Üst Vücut Gücü",
    duration: 35,
    difficulty: "İleri",
    category: "Kuvvet",
    muscleGroup: "Üst Vücut",
    equipment: ["Halter", "Makineler"],
    imageUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "leg-day",
    title: "Bacak Günü",
    duration: 40,
    difficulty: "Orta",
    category: "Alt Vücut",
    muscleGroup: "Alt Vücut",
    equipment: ["Halter", "Makineler"],
    imageUrl:
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "quick-hiit",
    title: "Hızlı HIIT",
    duration: 20,
    difficulty: "Başlangıç",
    category: "HIIT",
    muscleGroup: "Tüm Vücut",
    equipment: ["Ekipman yok"],
    imageUrl:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "core-stability",
    title: "Core Stabilizasyonu",
    duration: 25,
    difficulty: "Başlangıç",
    category: "Core",
    muscleGroup: "Core",
    equipment: ["Ekipman yok"],
    imageUrl:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "mobility-flow",
    title: "Hareketlilik Akışı",
    duration: 20,
    difficulty: "Başlangıç",
    category: "Hareketlilik",
    muscleGroup: "Tüm Vücut",
    equipment: ["Ekipman yok"],
    imageUrl:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "dumbbell-burn",
    title: "Dambıl ile Tüm Vücut",
    duration: 30,
    difficulty: "Başlangıç",
    category: "Kuvvet",
    muscleGroup: "Tüm Vücut",
    equipment: ["Dambıl"],
    imageUrl:
      "https://images.unsplash.com/photo-1585152968992-d2b9444408cc?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "cardio-burn",
    title: "Kardiyo Yakımı",
    duration: 30,
    difficulty: "Orta",
    category: "Kardiyo",
    muscleGroup: "Tüm Vücut",
    equipment: ["Ekipman yok"],
    imageUrl:
      "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=800&q=60",
  },
];

// Onboarding'de toplanan profil - gerçek kullanıcı state/API bağlandığında
// bu mock objenin yerine geçecek (bkz. onboarding/types.ts::OnboardingData).
export const MOCK_USER_PROFILE = {
  goal: "build_muscle" as const,
  trainingExperience: "beginner" as const,
  trainingLocation: "home" as const,
  equipment: ["dumbbells", "none"] as const,
};

const EQUIPMENT_KEY_MAP: Record<string, Workout["equipment"][number]> = {
  dumbbells: "Dambıl",
  barbell: "Halter",
  machines: "Makineler",
  bands: "Direnç bandı",
  none: "Ekipman yok",
};

export function getPersonalizedWorkouts(workouts: Workout[]): Workout[] {
  const profile = MOCK_USER_PROFILE;
  const experienceMap: Record<string, Workout["difficulty"]> = {
    beginner: "Başlangıç",
    intermediate: "Orta",
    advanced: "İleri",
  };
  const targetDifficulty = experienceMap[profile.trainingExperience];
  const ownedEquipment = profile.equipment.map((key) => EQUIPMENT_KEY_MAP[key]);

  return workouts
    .filter(
      (workout) =>
        workout.difficulty === targetDifficulty &&
        workout.equipment.some((item) => ownedEquipment.includes(item)),
    )
    .slice(0, 4);
}
