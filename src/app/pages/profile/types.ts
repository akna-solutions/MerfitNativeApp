export type Goal =
  | "Build Muscle"
  | "Lose Weight"
  | "Improve Fitness"
  | "Build Strength"
  | "Stay Active";

export type Experience = "Beginner" | "Intermediate" | "Advanced";
export type ActivityLevel =
  | "Sedentary"
  | "Light"
  | "Moderate"
  | "Active"
  | "Athlete";
export type WorkoutLocation = "Home" | "Gym" | "Outdoor";
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
