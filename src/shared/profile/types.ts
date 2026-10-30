export type Gender = "Erkek" | "Kadın" | "Diğer" | "Belirtmek istemiyorum";

/** Profilde secilebilen cinsiyetler. "Diğer" / "Belirtmek istemiyorum" yalnizca eski kayitlar icin tipte kalir. */
export const GENDER_OPTIONS: Gender[] = ["Kadın", "Erkek"];

export type Goal =
  | "LOSE_WEIGHT"
  | "BUILD_MUSCLE"
  | "MAINTAIN_WEIGHT"
  | "IMPROVE_ENDURANCE"
  | "GET_STRONGER"
  | "GENERAL_FITNESS";

export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type Equipment =
  | "FULL_GYM"
  | "HOME_GYM"
  | "BODYWEIGHT"
  | "MINIMAL_EQUIPMENT";

export type TrainingLocation = "gym" | "home" | "outdoor";

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type UnitSystem = "metric" | "imperial";
export type AppearanceMode = "dark" | "light" | "system";

export type NotificationSettings = {
  workoutReminders: boolean;
  dailyGoalReminder: boolean;
  streakReminder: boolean;
  progressUpdates: boolean;
  leaderboardUpdates: boolean;
  productUpdates: boolean;
};

export type PrivacySettings = {
  profileVisibleOnLeaderboard: boolean;
  shareWorkoutStatistics: boolean;
  personalizedRecommendations: boolean;
};

// Onboarding'de toplanan bilgilerle örtüşür (bkz. onboarding/types.ts).
// Backend bağlandığında bu tek obje gerçek kullanıcı kaydına dönüşecek.
export type ProfileData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  /** Sunucudan gelir; profil henuz yuklenmediyse undefined (dogrulama uyarisi gosterilmez). */
  emailConfirmed?: boolean;
  /**
   * Fitness profili (boy, kilo, hedef...) dolu mu. Yalnizca alisveris icin kayit olan kullanicida false;
   * MB Fit ekranlari bu durumda once profili tamamlatir (bkz. FitnessProfileGate). Profil yuklenmediyse undefined.
   */
  fitnessProfileCompleted?: boolean;
  dateOfBirth: string; // "YYYY-MM-DD"
  gender: Gender;

  age: number;
  height: number; // cm
  weight: number; // kg
  targetWeight: number; // kg

  goal: Goal;

  experienceLevel: ExperienceLevel;
  equipment: Equipment;
  /** Kayitta secilen antrenman yeri; secilmediyse null. */
  trainingLocation: TrainingLocation | null;
  workoutDurationMin: number;
  /** Kayitta secilen haftalik antrenman gunu sayisi. */
  trainingDaysPerWeek: number;
  /** Aktif programdaki gunler (backend WorkoutPlanDay). Program yoksa bos. */
  trainingDays: Weekday[];

  unitSystem: UnitSystem;
  appearance: AppearanceMode;

  notifications: NotificationSettings;
  privacy: PrivacySettings;

  stats: {
    workouts: number;
    streak: number;
  };
};

/** Profilde secilebilen hedefler. Diger kodlar yalnizca eski kayitlar icin tipte kalir. */
export const PRIMARY_GOALS: Goal[] = ["BUILD_MUSCLE", "GET_STRONGER", "LOSE_WEIGHT"];

/** Eski hedef kodlarini ana hedefe esler (backend FitnessGoals.Normalize ile ayni: Kas Gelistirme). */
export function normalizeGoal(goal: Goal | null | undefined): Goal | null {
  if (!goal) return null;
  return PRIMARY_GOALS.includes(goal) ? goal : "BUILD_MUSCLE";
}

export const GOAL_LABELS: Record<Goal, string> = {
  BUILD_MUSCLE: "Kas Geliştirme",
  GET_STRONGER: "Güçlenme",
  LOSE_WEIGHT: "Yağ Kaybı",
  // Eski hedefler (sunucu Kas Geliştirme'ye esler):
  MAINTAIN_WEIGHT: "Kas Geliştirme",
  IMPROVE_ENDURANCE: "Kas Geliştirme",
  GENERAL_FITNESS: "Kas Geliştirme",
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  BEGINNER: "Başlangıç",
  INTERMEDIATE: "Orta",
  ADVANCED: "İleri",
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  FULL_GYM: "Tam Donanımlı Salon",
  HOME_GYM: "Ev Salonu",
  BODYWEIGHT: "Vücut Ağırlığı",
  MINIMAL_EQUIPMENT: "Minimal Ekipman",
};

export const TRAINING_LOCATION_LABELS: Record<TrainingLocation, string> = {
  gym: "Spor salonu",
  home: "Ev",
  outdoor: "Açık alan",
};

export const WEEKDAY_SHORT_LABELS: Record<Weekday, string> = {
  Mon: "Pzt",
  Tue: "Sal",
  Wed: "Çar",
  Thu: "Per",
  Fri: "Cum",
  Sat: "Cmt",
  Sun: "Paz",
};

export const WEEKDAYS: Weekday[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];
