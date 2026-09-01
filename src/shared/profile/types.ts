export type Gender = "Erkek" | "Kadın" | "Diğer" | "Belirtmek istemiyorum";

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
  dateOfBirth: string; // "YYYY-MM-DD"
  gender: Gender;

  age: number;
  height: number; // cm
  weight: number; // kg
  targetWeight: number; // kg

  goal: Goal;

  experienceLevel: ExperienceLevel;
  equipment: Equipment;
  workoutDurationMin: number;
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

export const GOAL_LABELS: Record<Goal, string> = {
  LOSE_WEIGHT: "Kilo Vermek",
  BUILD_MUSCLE: "Kas Yapmak",
  MAINTAIN_WEIGHT: "Kiloyu Korumak",
  IMPROVE_ENDURANCE: "Dayanıklılığı Artırmak",
  GET_STRONGER: "Daha Güçlü Olmak",
  GENERAL_FITNESS: "Genel Fitness",
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

export const WEEKDAYS: Weekday[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];
