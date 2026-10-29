import { apiRequest } from "./client";
import {
  ActivityCalendarResponse,
  LogWeightRequest,
  LogWeightResponse,
  ProgressRange,
  ProgressResponse,
  WeightReminderResponse,
  WeightReminderSnoozeAction,
} from "./types";

/** GET /api/progress - ProgressScreen'in ihtiyac duydugu tum veriyi getirir. */
export async function getProgress(range: ProgressRange = "3months", signal?: AbortSignal): Promise<ProgressResponse> {
  return apiRequest<ProgressResponse>("/api/progress", { query: { range }, signal });
}

/** POST /api/progress/weight - gunluk kilo girisi; ayni gune tekrar girilirse guncellenir. */
export async function logWeight(request: LogWeightRequest): Promise<LogWeightResponse> {
  return apiRequest<LogWeightResponse>("/api/progress/weight", { method: "POST", body: request });
}

/**
 * GET /api/progress/calendar - from..to (dahil, "yyyy-MM-dd", en fazla 62 gun) icin gunluk antrenman, beslenme
 * ve aktivite ozeti. Tum aralik tek istekte gelir.
 */
export async function getActivityCalendar(from: string, to: string, signal?: AbortSignal): Promise<ActivityCalendarResponse> {
  return apiRequest<ActivityCalendarResponse>("/api/progress/calendar", { query: { from, to }, signal });
}

/** GET /api/progress/weight-reminder - kilo hatirlaticisinin gosterilip gosterilmeyecegi. */
export async function getWeightReminder(signal?: AbortSignal): Promise<WeightReminderResponse> {
  return apiRequest<WeightReminderResponse>("/api/progress/weight-reminder", { signal });
}

/** POST /api/progress/weight-reminder/snooze - "later" (1 gun) veya "dismiss" (2 gun) erteler. */
export async function snoozeWeightReminder(action: WeightReminderSnoozeAction): Promise<WeightReminderResponse> {
  return apiRequest<WeightReminderResponse>("/api/progress/weight-reminder/snooze", { method: "POST", body: { action } });
}
