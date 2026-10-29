import { CalendarDay } from "../services/api/types";

/** Takvim testleri icin bos (kayitsiz) bir gun; alanlar override ile doldurulur. */
export function makeDay(overrides: Partial<CalendarDay> = {}): CalendarDay {
  return {
    date: "2026-10-20",
    isToday: false,
    isFuture: false,
    isPlannedWorkoutDay: null,
    workout: { completed: false, totalDurationSeconds: 0, sessions: [] },
    nutrition: { logged: false, consumedCalories: 0, protein: 0, carbs: 0, fat: 0, calorieRatio: null, calorieGoalMet: false, meals: [] },
    activity: { caloriesBurned: 0, activeMinutes: 0 },
    ...overrides,
  };
}
