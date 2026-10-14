import { apiRequest } from "./client";
import {
  LogMealItemRequest,
  LogWaterRequest,
  MealEntry,
  MealItemDetail,
  NutritionResponse,
  UpdateMealItemRequest,
  WaterSummary,
} from "./types";

/** GET /api/nutrition - verilen gune (varsayilan: bugun) ait beslenme ozeti. */
export async function getDailyNutrition(date?: string, signal?: AbortSignal): Promise<NutritionResponse> {
  return apiRequest<NutritionResponse>("/api/nutrition", { query: { date }, signal });
}

/** POST /api/nutrition/meals - secilen besini gunluge ekler. */
export async function logMealItem(request: LogMealItemRequest): Promise<MealEntry> {
  return apiRequest<MealEntry>("/api/nutrition/meals", { method: "POST", body: request });
}

/** GET /api/nutrition/meals/{id} - kaydin duzenleme detayi. */
export async function getMealItem(id: number, signal?: AbortSignal): Promise<MealItemDetail> {
  return apiRequest<MealItemDetail>(`/api/nutrition/meals/${id}`, { signal });
}

/** PUT /api/nutrition/meals/{id} - kaydin miktarini degistirir, guncel kaydi doner. */
export async function updateMealItem(id: number, request: UpdateMealItemRequest): Promise<MealEntry> {
  return apiRequest<MealEntry>(`/api/nutrition/meals/${id}`, { method: "PUT", body: request });
}

/** DELETE /api/nutrition/meals/{id} - kaydi gunlukten siler. */
export async function deleteMealItem(id: number): Promise<void> {
  return apiRequest<void>(`/api/nutrition/meals/${id}`, { method: "DELETE" });
}

/** POST /api/nutrition/water - su tuketimi ekler, guncel toplami doner. */
export async function logWater(request: LogWaterRequest): Promise<WaterSummary> {
  return apiRequest<WaterSummary>("/api/nutrition/water", { method: "POST", body: request });
}
