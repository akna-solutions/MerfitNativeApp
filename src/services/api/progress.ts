import { apiRequest } from "./client";
import { ProgressRange, ProgressResponse } from "./types";

/** GET /api/progress - ProgressScreen'in ihtiyac duydugu tum veriyi getirir. */
export async function getProgress(range: ProgressRange = "3months", signal?: AbortSignal): Promise<ProgressResponse> {
  return apiRequest<ProgressResponse>("/api/progress", { query: { range }, signal });
}
