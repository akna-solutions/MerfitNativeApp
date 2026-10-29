import { apiRequest } from "./client";
import { AchievementsResponse } from "./types";

/** GET /api/achievements - tum rozetler, kazanilanlar ve henuz gosterilmemis yeni rozetler. */
export async function getAchievements(signal?: AbortSignal): Promise<AchievementsResponse> {
  return apiRequest<AchievementsResponse>("/api/achievements", { signal });
}

/** POST /api/achievements/seen - kutlamasi gosterilen rozetleri "goruldu" isaretler (tekrar gosterilmez). */
export async function markAchievementsSeen(achievementIds: number[]): Promise<void> {
  await apiRequest<void>("/api/achievements/seen", { method: "POST", body: { achievementIds } });
}
