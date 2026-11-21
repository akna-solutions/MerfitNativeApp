import { apiRequest } from "./client";

/**
 * Gunluk kalori dengesi uc noktalari (MerfitCustomerApi /api/energy-balance). Hesaplama tamamen sunucudadir:
 * Harcanan = BMR (Mifflin-St Jeor) + adim kalorisi (antrenman sirasindaki adimlar haric) + antrenman (net) +
 * besinlerin termik etkisi. Tarihler cihazin yerel gunudur (yyyy-MM-dd).
 */

export type EnergyTone = "green" | "blue" | "orange" | "red";
export type EnergyStatus = "aligned" | "neutral" | "surplus" | "attention" | "in_progress" | "insufficient_data";
export type GoalDirection = "lose" | "maintain" | "gain" | "unknown";

export type EnergyExpenditure = {
  bmr: number | null;
  bmrFullDay: number | null;
  walking: number;
  dailyMovement: number;
  workout: number;
  thermicEffect: number;
  deduplicatedStepCalories: number;
  method: string;
};

export type EnergyMeal = {
  type: "breakfast" | "lunch" | "dinner" | "snack";
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  itemCount: number;
};

export type EnergyNutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinTarget: number | null;
  carbsTarget: number | null;
  fatTarget: number | null;
  itemCount: number;
  meals: EnergyMeal[];
};

export type EnergyWorkout = {
  sessionId: number;
  title: string;
  kind: string;
  completedAt: string;
  minutes: number;
  calories: number;
};

export type EnergyActivity = {
  steps: number;
  walkingSteps: number;
  distanceMeters: number;
  workoutMinutes: number;
  workoutCalories: number;
  overlappingSteps: number;
  workouts: EnergyWorkout[];
};

export type EnergyInsight = { code: string; tone: EnergyTone; text: string };

export type EnergyDataQuality = {
  hasMeals: boolean;
  hasSteps: boolean;
  stepsVerified: boolean;
  stepsLastSyncedAt: string | null;
  stepSyncStale: boolean;
  profileComplete: boolean;
  missingProfileFields: string[];
  genderEstimated: boolean;
  workoutsWithoutCalories: number;
  weightFromMeasurement: boolean;
  weightKgUsed: number | null;
  isPartialDay: boolean;
  isComplete: boolean;
};

export type EnergyDay = {
  date: string;
  isToday: boolean;
  elapsedDayFraction: number;
  intakeCalories: number;
  expenditureCalories: number | null;
  balance: number | null;
  balanceKind: "surplus" | "deficit" | "balanced" | null;
  targetCalories: number | null;
  remainingCalories: number | null;
  plannedBalance: number | null;
  goalDirection: GoalDirection;
  status: EnergyStatus;
  tone: EnergyTone;
  headline: string;
  expenditure: EnergyExpenditure;
  nutrition: EnergyNutrition;
  activity: EnergyActivity;
  insights: EnergyInsight[];
  dataQuality: EnergyDataQuality;
};

export type EnergyRangeDay = {
  date: string;
  isToday: boolean;
  intakeCalories: number;
  expenditureCalories: number | null;
  balance: number | null;
  tone: EnergyTone;
  status: EnergyStatus;
  hasMeals: boolean;
  isComplete: boolean;
  steps: number;
  workoutCalories: number;
};

export type EnergyWeek = {
  start: string;
  end: string;
  completeDays: number;
  averageBalance: number | null;
  averageIntake: number | null;
  averageExpenditure: number | null;
};

export type EnergyRange = {
  from: string;
  to: string;
  today: string;
  timeZone: string;
  targetCalories: number | null;
  goalDirection: GoalDirection;
  days: EnergyRangeDay[];
  summary: {
    completeDays: number;
    totalDays: number;
    averageIntake: number | null;
    averageExpenditure: number | null;
    averageBalance: number | null;
    totalBalance: number | null;
    estimatedWeightChangeKg: number | null;
    weight: {
      startDate: string | null;
      startKg: number | null;
      endDate: string | null;
      endKg: number | null;
      changeKg: number | null;
      measurementCount: number;
    };
    analysis: string | null;
  };
  weeks: EnergyWeek[];
};

/** GET /api/energy-balance/day?date=yyyy-MM-dd */
export function getEnergyDay(date: string, signal?: AbortSignal): Promise<EnergyDay> {
  return apiRequest<EnergyDay>("/api/energy-balance/day", { query: { date }, signal });
}

/** GET /api/energy-balance?from&to (en fazla 92 gun) */
export function getEnergyRange(from: string, to: string, signal?: AbortSignal): Promise<EnergyRange> {
  return apiRequest<EnergyRange>("/api/energy-balance", { query: { from, to }, signal });
}
