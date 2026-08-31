export type Goal =
  | "Kas Yapmak"
  | "Kilo Vermek"
  | "Fitness Seviyesini Artırmak"
  | "Güç Kazanmak"
  | "Aktif Kalmak";

export type Experience = "Başlangıç" | "Orta" | "İleri";
export type ActivityLevel =
  | "Hareketsiz"
  | "Hafif"
  | "Orta"
  | "Aktif"
  | "Sporcu";
export type WorkoutLocation = "Ev" | "Spor Salonu" | "Açık Alan";
export type UnitSystem = "metric" | "imperial";

// Onboarding'de toplanan bilgilerle birebir örtüşüyor
// (bkz. onboarding/types.ts::OnboardingData). Backend bağlandığında bu
// objenin kaynağı onboarding + kullanıcı hesabı olacak, component'ler
// değişmeyecek.
export type ProfileData = {
  firstName: string;
  username: string;
  email: string;
  avatarUrl?: string;

  age: number;
  height: number; // cm
  weight: number; // kg

  goal: Goal;
  goalDescription: string;

  experience: Experience;
  activityLevel: ActivityLevel;
  trainingDays: number;
  workoutLocation: WorkoutLocation;
  equipment: string[];

  stats: {
    workouts: number;
    streak: number;
    weight: number;
  };

  unitSystem: UnitSystem;
};
