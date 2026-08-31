export type MealType = "Kahvaltı" | "Öğle Yemeği" | "Akşam Yemeği" | "Atıştırmalık";

export const MEAL_TYPES: MealType[] = [
  "Kahvaltı",
  "Öğle Yemeği",
  "Akşam Yemeği",
  "Atıştırmalık",
];

export type MealEntry = {
  id: string;
  type: MealType;
  name: string;
  calories: number;
};

export type MacroTarget = {
  consumed: number;
  target: number;
};

export type FoodItem = {
  id: string;
  name: string;
  calories: number;
};

// Onboarding'de alınan goal/age/height/weight/activityLevel/trainingFrequency
// gibi bilgilere göre backend bu hedefleri hesaplayacak; component'ler
// sadece hazır değerleri render ediyor (bkz. onboarding/types.ts::OnboardingData).
export type NutritionData = {
  hasLoggedFirstMeal: boolean;
  dailyCalories: number;
  macros: {
    protein: MacroTarget;
    carbs: MacroTarget;
    fats: MacroTarget;
  };
  water: {
    consumedL: number;
    targetL: number;
  };
  meals: MealEntry[];
};
