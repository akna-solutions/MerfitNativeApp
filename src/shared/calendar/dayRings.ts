import { CalendarDay } from "../../services/api/types";
import { ACTIVE_MINUTES_REFERENCE } from "./ringColors";

/**
 * Bir gunun halka degerleri (0-1). Veri olmayan halka null'dir ve hic cizilmez; boylece kayit
 * olmayan veya gelecekteki gunlerde sahte ilerleme gorunmez.
 */
export type DayRingValues = {
  workout: number | null;
  activity: number | null;
  nutrition: number | null;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function dayRingValues(day: CalendarDay | undefined): DayRingValues {
  if (!day || day.isFuture) return { workout: null, activity: null, nutrition: null };

  const workout = day.workout.completed ? 1 : null;
  const activity = day.activity.activeMinutes > 0 ? clamp(day.activity.activeMinutes / ACTIVE_MINUTES_REFERENCE) : null;
  // Hedef yoksa oran hesaplanamaz: yalnizca kayit varligina gore halka cizmek yanlis yonlendirir.
  const nutrition = day.nutrition.logged && day.nutrition.calorieRatio !== null
    ? day.nutrition.calorieGoalMet ? 1 : clamp(day.nutrition.calorieRatio)
    : null;

  return { workout, activity, nutrition };
}

export function hasAnyRecord(day: CalendarDay | undefined): boolean {
  if (!day || day.isFuture) return false;
  return day.workout.completed || day.nutrition.logged || day.activity.activeMinutes > 0;
}
