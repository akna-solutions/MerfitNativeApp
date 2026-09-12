import { apiRequest } from "./client";
import { LogMealItemRequest, LogWaterRequest, MealEntry, NutritionResponse, WaterSummary } from "./types";

/** GET /api/nutrition - verilen gune (varsayilan: bugun) ait beslenme ozeti. */
export async function getDailyNutrition(date?: string, signal?: AbortSignal): Promise<NutritionResponse> {
  return apiRequest<NutritionResponse>("/api/nutrition", { query: { date }, signal });
}

/** POST /api/nutrition/meals - secilen besini gunluge ekler. */
export async function logMealItem(request: LogMealItemRequest): Promise<MealEntry> {
  return apiRequest<MealEntry>("/api/nutrition/meals", { method: "POST", body: request });
}

/** POST /api/nutrition/water - su tuketimi ekler, guncel toplami doner. */
export async function logWater(request: LogWaterRequest): Promise<WaterSummary> {
  return apiRequest<WaterSummary>("/api/nutrition/water", { method: "POST", body: request });
}
