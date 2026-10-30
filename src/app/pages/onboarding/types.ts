import type { FitnessGoalCode } from "../../../services/api/types";

export type Gender = "male" | "female";

/** Kayit amaci: "shopping" secilirse fitness adimlari (boy, kilo, hedef...) atlanir. */
export type Purpose = "fitness" | "shopping";

export type HeightUnit = "cm" | "ft_in";
export type WeightUnit = "kg" | "lb";

export type Goal = FitnessGoalCode;

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "athlete";

export type TrainingExperience = "beginner" | "intermediate" | "advanced";

export type TrainingLocation = "gym" | "home" | "outdoor";

/**
 * Secilen ekipmanlar: GET /api/equipment listesinden gelen sayisal Equipment.Id degerleri.
 * "none" (Ekipman yok) yalnizca istemcide bulunan bir secenektir; backend'e gonderilmez.
 */
export type EquipmentSelection = number | "none";

// Tek bir state objesi - backend'e gönderilecek onboarding profili.
export type OnboardingData = {
  /** Kayit amaci (PurposeStep); varsayilan tam uygulama (MB Fit + MB Shop). */
  purpose: Purpose;
  name: string;
  lastName: string;
  /** Kullanicinin kendi sectigi kullanici adi (AccountStep). "@" ONEKI ICERMEZ. */
  username: string;
  gender: Gender | null;
  age: string;
  height: string;
  heightUnit: HeightUnit;
  heightFeet: string;
  heightInches: string;
  weight: string;
  weightUnit: WeightUnit;
  goal: Goal | null;
  /** Opsiyonel vucut kompozisyonu (BodyCompositionStep); bos string = girilmedi. */
  bodyFat: string;
  neck: string;
  waist: string;
  hip: string;
  /** Dusuk yag orani uyarisini kullanici acikca onayladiysa true; hedef/olcum degisince sifirlanir. */
  confirmLowBodyFatWarning: boolean;
  activityLevel: ActivityLevel | null;
  trainingExperience: TrainingExperience | null;
  trainingDays: number | null;
  trainingLocation: TrainingLocation | null;
  equipment: EquipmentSelection[];
  email: string;
  password: string;
  confirmPassword: string;
};

export const initialOnboardingData: OnboardingData = {
  purpose: "fitness",
  name: "",
  lastName: "",
  username: "",
  gender: null,
  age: "",
  height: "",
  heightUnit: "cm",
  heightFeet: "",
  heightInches: "",
  weight: "",
  weightUnit: "kg",
  goal: null,
  bodyFat: "",
  neck: "",
  waist: "",
  hip: "",
  confirmLowBodyFatWarning: false,
  activityLevel: null,
  trainingExperience: null,
  trainingDays: null,
  trainingLocation: null,
  equipment: [],
  email: "",
  password: "",
  confirmPassword: "",
};
