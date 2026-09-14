import { apiRequest } from "./client";
import { MyNutritionPlanResponse, MyTodayNutritionPlanResponse } from "./types";

/**
 * GET /api/my-nutrition-plan - kullanicinin aktif kisisel beslenme programini getirir.
 * Gercekte tuketilen ogunlerin loglandigi services/api/nutrition.ts'ten bagimsizdir
 * (PLAN vs LOG ayrimi - bkz. backend Faz 2 raporu).
 */
export async function getMyNutritionPlan(signal?: AbortSignal): Promise<MyNutritionPlanResponse> {
  return apiRequest<MyNutritionPlanResponse>("/api/my-nutrition-plan", { signal });
}

/** GET /api/my-nutrition-plan/today - bugunun (aktif plandaki) beslenme gununu getirir. */
export async function getTodayNutritionPlan(
  signal?: AbortSignal,
): Promise<MyTodayNutritionPlanResponse> {
  return apiRequest<MyTodayNutritionPlanResponse>("/api/my-nutrition-plan/today", { signal });
}
