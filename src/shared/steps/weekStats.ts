import type { StepDay, StepSettings, StepWeeklySummary } from "../../services/api/steps";
import { addDays, parseDateKey, toDateKey } from "../calendar/dates";
import { estimateFromSteps, LocalStepDay, totalSteps } from "./stepState";

export type MergedStepDay = {
  date: string;
  steps: number;
  distanceKm: number;
  calories: number;
  goal: number;
  goalCompleted: boolean;
};

export type WeekStats = {
  days: MergedStepDay[];
  totalSteps: number;
  averageSteps: number;
  totalDistanceKm: number;
  totalCalories: number;
  goalCompletedDays: number;
  /** 0-100 */
  goalCompletionRate: number;
  mostActiveDay: MergedStepDay | null;
  /** Onceki 7 gune gore degisim (%); sunucu verisi yoksa ya da onceki donem 0 ise null. */
  changePercent: number | null;
};

/**
 * Son 7 gunu (bugun dahil) sunucu ozeti ve cihazdaki yerel veriyle birlestirir. Yerel veri henuz senkronize
 * edilmemis adimlari icerebilir; bu yuzden her gun icin buyuk olan alinir (cift sayim olmaz). Sunucuya
 * ulasilamazsa yalnizca yerel veri kullanilir.
 */
export function buildWeekStats(
  todayKey: string,
  localDays: Record<string, LocalStepDay>,
  server: StepWeeklySummary | null,
  currentGoal: number,
  settings: StepSettings,
): WeekStats {
  const today = parseDateKey(todayKey) ?? new Date();
  const serverByDate = new Map<string, StepDay>((server?.days ?? []).map((d) => [d.date, d]));

  const days: MergedStepDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const key = toDateKey(addDays(today, -i));
    const remote = serverByDate.get(key);
    const localSteps = totalSteps(localDays[key]?.hourly);
    const remoteSteps = remote?.totalSteps ?? 0;
    // Bugunun hedefi her zaman guncel hedef (degistirince yuzde aninda guncellenir); gecmis gunler kendi hedefini korur.
    const goal = key === todayKey ? currentGoal : remote?.hasData ? remote.dailyGoal : currentGoal;
    let steps: number;
    let distanceKm: number;
    let calories: number;
    if (remote && remoteSteps >= localSteps) {
      steps = remoteSteps;
      distanceKm = remote.distanceMeters / 1000;
      calories = remote.caloriesBurned;
    } else {
      steps = localSteps;
      ({ distanceKm, calories } = estimateFromSteps(localSteps, settings));
    }
    days.push({ date: key, steps, distanceKm, calories, goal, goalCompleted: steps > 0 && steps >= goal });
  }

  const total = days.reduce((sum, d) => sum + d.steps, 0);
  const completed = days.filter((d) => d.goalCompleted).length;
  const mostActive = days.reduce<MergedStepDay | null>(
    (best, d) => (d.steps > 0 && (!best || d.steps >= best.steps) ? d : best),
    null,
  );
  const previous = server?.previousPeriodTotalSteps ?? 0;

  return {
    days,
    totalSteps: total,
    averageSteps: Math.round(total / 7),
    totalDistanceKm: days.reduce((sum, d) => sum + d.distanceKm, 0),
    totalCalories: days.reduce((sum, d) => sum + d.calories, 0),
    goalCompletedDays: completed,
    goalCompletionRate: Math.round((completed / 7) * 1000) / 10,
    mostActiveDay: mostActive,
    changePercent: server && previous > 0 ? Math.round(((total - previous) / previous) * 1000) / 10 : null,
  };
}
