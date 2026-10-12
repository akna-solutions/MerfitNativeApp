import { apiRequest } from "./client";
import { LogWeightRequest, LogWeightResponse, ProgressRange, ProgressResponse } from "./types";

/** GET /api/progress - ProgressScreen'in ihtiyac duydugu tum veriyi getirir. */
export async function getProgress(range: ProgressRange = "3months", signal?: AbortSignal): Promise<ProgressResponse> {
  return apiRequest<ProgressResponse>("/api/progress", { query: { range }, signal });
}

/** POST /api/progress/weight - gunluk kilo girisi; ayni gune tekrar girilirse guncellenir. */
export async function logWeight(request: LogWeightRequest): Promise<LogWeightResponse> {
  return apiRequest<LogWeightResponse>("/api/progress/weight", { method: "POST", body: request });
}
