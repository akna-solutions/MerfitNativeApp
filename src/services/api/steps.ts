import { apiRequest } from "./client";

/**
 * Adim sayar uc noktalari (MerfitCustomerApi /api/activity/steps). Tarihler cihazin yerel gunudur (yyyy-MM-dd).
 * Sunucuya sensorun kumulatif degeri DEGIL, her gunun 24 saatlik adim kovasi gonderilir; sunucu saat bazinda
 * buyuk olani tuttugu icin ayni istegin tekrari adimlari iki kez eklemez.
 */

export type StepSettings = {
  /** Sunucunun profile gore belirledigi gunluk hedef; kullanici degistiremez. */
  dailyGoal: number;
  /** "auto": hedef sunucuda belirlendi. Eski sunucu/onbellek yanitlarinda yoktur. */
  goalSource?: "auto";
  /** Hedefin neye gore belirlendigi (orn. "Hedefin aktivite seviyene göre otomatik belirlendi."). */
  goalReason?: string;
  defaultDailyGoal: number;
  minDailyGoal: number;
  maxDailyGoal: number;
  /** Profil boyundan tahmini adim uzunlugu (m). */
  strideLengthMeters: number;
  /** Profil kilosundan adim basina tahmini kalori (kcal). */
  caloriesPerStep: number;
};

export type StepDay = {
  date: string;
  totalSteps: number;
  distanceMeters: number;
  caloriesBurned: number;
  dailyGoal: number;
  goalCompleted: boolean;
  completionPercent: number;
  hasData: boolean;
  /** false: gun makullik kontrollerine takildi; adimlar gosterilir ama rozet/puan kazandirmaz. */
  isVerified: boolean;
  hourlySteps?: number[] | null;
};

export type StepSyncDayResult = StepDay & {
  status: "accepted" | "unchanged" | "rejected";
  reason?: string | null;
};

export type StepSyncDay = { date: string; hourlySteps: number[]; utcOffsetMinutes: number };

export type StepSource = "pedometer" | "healthkit" | "health_connect";

export type StepSyncRequest = { days: StepSyncDay[]; source: StepSource; platform?: "ios" | "android" };

export type StepSyncResponse = { days: StepSyncDayResult[]; settings: StepSettings };

export type StepWeeklySummary = {
  startDate: string;
  endDate: string;
  days: StepDay[];
  totalSteps: number;
  averageSteps: number;
  totalDistanceMeters: number;
  totalCaloriesBurned: number;
  goalCompletedDays: number;
  goalCompletionRate: number;
  mostActiveDay: StepDay | null;
  previousPeriodTotalSteps: number;
  changePercent: number | null;
};

/** POST /api/activity/steps/sync */
export function syncSteps(request: StepSyncRequest, signal?: AbortSignal): Promise<StepSyncResponse> {
  return apiRequest<StepSyncResponse>("/api/activity/steps/sync", { method: "POST", body: request, signal });
}

/** GET /api/activity/steps/settings */
export function getStepSettings(signal?: AbortSignal): Promise<StepSettings> {
  return apiRequest<StepSettings>("/api/activity/steps/settings", { signal });
}

/** GET /api/activity/steps/days/{date} - saatlik adimlar dahil. */
export function getStepDay(date: string, signal?: AbortSignal): Promise<StepDay> {
  return apiRequest<StepDay>(`/api/activity/steps/days/${date}`, { signal });
}

/** GET /api/activity/steps/summary/weekly?endDate= - endDate dahil son 7 gun. */
export function getWeeklyStepSummary(endDate: string, signal?: AbortSignal): Promise<StepWeeklySummary> {
  return apiRequest<StepWeeklySummary>("/api/activity/steps/summary/weekly", { query: { endDate }, signal });
}
