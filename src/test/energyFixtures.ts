import type { EnergyDay, EnergyRange, EnergyRangeDay } from "../services/api/energyBalance";

/** Testler icin sunucu yanitina birebir uyan kalori dengesi gunu (degerler tutarli: toplam = kalemler). */
export function makeEnergyDay(overrides: Partial<EnergyDay> = {}): EnergyDay {
  return {
    date: "2026-11-20",
    isToday: true,
    elapsedDayFraction: 0.5,
    intakeCalories: 1200,
    expenditureCalories: 1300,
    balance: -100,
    balanceKind: "deficit",
    targetCalories: 2000,
    remainingCalories: 800,
    plannedBalance: -500,
    goalDirection: "lose",
    status: "in_progress",
    tone: "blue",
    headline: "Hedefine 800 kcal kaldı. Gün devam ediyor; harcaman şu ana kadarki kısımdır.",
    expenditure: { bmr: 890, bmrFullDay: 1780, walking: 120, dailyMovement: 70, workout: 100, thermicEffect: 120, deduplicatedStepCalories: 0, method: "bmr_plus_active" },
    nutrition: {
      calories: 1200, protein: 80, carbs: 120, fat: 40, proteinTarget: 150, carbsTarget: 200, fatTarget: 60, itemCount: 3,
      meals: [
        { type: "breakfast", label: "Kahvaltı", calories: 500, protein: 30, carbs: 50, fat: 20, itemCount: 2 },
        { type: "lunch", label: "Öğle Yemeği", calories: 700, protein: 50, carbs: 70, fat: 20, itemCount: 1 },
        { type: "dinner", label: "Akşam Yemeği", calories: 0, protein: 0, carbs: 0, fat: 0, itemCount: 0 },
        { type: "snack", label: "Atıştırmalık", calories: 0, protein: 0, carbs: 0, fat: 0, itemCount: 0 },
      ],
    },
    activity: { steps: 5000, walkingSteps: 3000, distanceMeters: 3750, workoutMinutes: 30, workoutCalories: 100, overlappingSteps: 0, workouts: [] },
    insights: [],
    dataQuality: {
      hasMeals: true, hasSteps: true, stepsVerified: true, stepsLastSyncedAt: null, stepSyncStale: false, profileComplete: true,
      missingProfileFields: [], genderEstimated: false, workoutsWithoutCalories: 0, weightFromMeasurement: true, weightKgUsed: 80,
      isPartialDay: true, isComplete: false,
    },
    ...overrides,
  };
}

export function makeRangeDay(date: string, overrides: Partial<EnergyRangeDay> = {}): EnergyRangeDay {
  return {
    date, isToday: false, intakeCalories: 1800, expenditureCalories: 2200, balance: -400, tone: "green", status: "aligned",
    hasMeals: true, isComplete: true, steps: 6000, workoutCalories: 0, ...overrides,
  };
}

export function makeEnergyRange(overrides: Partial<EnergyRange> = {}): EnergyRange {
  const days = ["2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"].map((d) => makeRangeDay(d));
  days.push(makeRangeDay("2026-11-20", { isToday: true, isComplete: false, tone: "blue", status: "in_progress" }));
  return {
    from: "2026-11-14", to: "2026-11-20", today: "2026-11-20", timeZone: "Europe/Istanbul", targetCalories: 2000, goalDirection: "lose",
    days,
    summary: {
      completeDays: 6, totalDays: 7, averageIntake: 1800, averageExpenditure: 2200, averageBalance: -400, totalBalance: -2400,
      estimatedWeightChangeKg: -0.31,
      weight: { startDate: "2026-11-14", startKg: 80, endDate: "2026-11-19", endKg: 79.6, changeKg: -0.4, measurementCount: 2 },
      analysis: "Kayıtlı 6 günde ortalama günlük 400 kcal açık.",
    },
    weeks: [{ start: "2026-11-14", end: "2026-11-20", completeDays: 6, averageBalance: -400, averageIntake: 1800, averageExpenditure: 2200 }],
    ...overrides,
  };
}
