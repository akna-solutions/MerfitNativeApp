import type { MyWorkoutPlanResponse } from "../../services/api/types";

/** Pazartesiden baslayan hafta sirasi (backend'in dayOfWeek degerleri). */
export const WEEK_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

/**
 * Aktif programa gore haftanin dinlenme gunleri (Pazartesi = 0). Programda antrenmani olmayan gun
 * dinlenme gunudur. Program yoksa veya hic gun icermiyorsa null (dinlenme gunu bilinmiyor).
 */
export function planRestDays(plan: MyWorkoutPlanResponse): boolean[] | null {
  if (!plan || plan.days.length === 0) return null;
  const trainingDays = new Set(plan.days.map((day) => day.dayOfWeek));
  return WEEK_ORDER.map((name) => !trainingDays.has(name));
}

/**
 * Plan gunu icin aktif antrenman rota parametreleri. Kisisel antrenman motoru gunlerinde katalog antrenmani
 * yoktur (workout.id null): oturum yalnizca plan gunu kimligiyle baslar; rota kimligi "day-<id>" olur.
 * Katalog gunlerinde eski davranis korunur (plan gunu kimligi biliniyorsa gonderilir).
 */
export function activeWorkoutParams(
  workout: { id: number | null; title: string },
  workoutPlanDayId: number | null | undefined,
): { id: string; title: string; workoutPlanDayId?: string } | null {
  if (workout.id === null || workout.id === undefined) {
    if (!workoutPlanDayId) return null;
    return { id: `day-${workoutPlanDayId}`, title: workout.title, workoutPlanDayId: String(workoutPlanDayId) };
  }
  return {
    id: String(workout.id),
    title: workout.title,
    workoutPlanDayId: workoutPlanDayId ? String(workoutPlanDayId) : undefined,
  };
}
