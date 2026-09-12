import { apiRequest } from "./client";
import { LeaderboardPeriod, LeaderboardResponse } from "./types";

/** GET /api/leaderboard - LeaderboardScreen'in ihtiyac duydugu tum veriyi getirir. */
export async function getLeaderboard(period: LeaderboardPeriod = "month", signal?: AbortSignal): Promise<LeaderboardResponse> {
  return apiRequest<LeaderboardResponse>("/api/leaderboard", { query: { period }, signal });
}
