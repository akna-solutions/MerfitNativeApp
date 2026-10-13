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
