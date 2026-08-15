export type Gender = "male" | "female";

export type HeightUnit = "cm" | "ft_in";
export type WeightUnit = "kg" | "lb";

export type Goal =
  | "lose_weight"
  | "build_muscle"
  | "get_stronger"
  | "improve_fitness"
  | "maintain_weight"
  | "improve_endurance";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "athlete";

export type TrainingExperience = "beginner" | "intermediate" | "advanced";

export type TrainingLocation = "gym" | "home" | "outdoor";

export type Equipment =
  | "dumbbells"
  | "barbell"
  | "bands"
  | "machines"
  | "pullup_bar"
  | "kettlebell"
  | "none";

// Tek bir state objesi - backend'e gönderilecek onboarding profili.
export type OnboardingData = {
  name: string;
  gender: Gender | null;
  age: string;
  height: string;
  heightUnit: HeightUnit;
  heightFeet: string;
  heightInches: string;
  weight: string;
  weightUnit: WeightUnit;
  goal: Goal | null;
  activityLevel: ActivityLevel | null;
  trainingExperience: TrainingExperience | null;
  trainingDays: number | null;
  trainingLocation: TrainingLocation | null;
  equipment: Equipment[];
  email: string;
  password: string;
  confirmPassword: string;
};

export const initialOnboardingData: OnboardingData = {
  name: "",
  gender: null,
  age: "",
  height: "",
  heightUnit: "cm",
  heightFeet: "",
  heightInches: "",
  weight: "",
  weightUnit: "kg",
  goal: null,
  activityLevel: null,
  trainingExperience: null,
  trainingDays: null,
  trainingLocation: null,
  equipment: [],
  email: "",
  password: "",
  confirmPassword: "",
};
