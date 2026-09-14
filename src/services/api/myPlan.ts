import { apiRequest } from "./client";
import { MyTodayWorkoutPlanResponse, MyWorkoutPlanResponse } from "./types";

/**
 * GET /api/my-plan - kullanicinin aktif kisisel antrenman programini getirir.
 * Genel antrenman katalogu icin bkz. services/api/workouts.ts - bu ikisi birbirinden bagimsizdir.
 */
export async function getMyPlan(signal?: AbortSignal): Promise<MyWorkoutPlanResponse> {
  return apiRequest<MyWorkoutPlanResponse>("/api/my-plan", { signal });
}

/** GET /api/my-plan/today - bugunun (aktif plandaki) antrenmanini getirir. */
export async function getTodayPlan(signal?: AbortSignal): Promise<MyTodayWorkoutPlanResponse> {
  return apiRequest<MyTodayWorkoutPlanResponse>("/api/my-plan/today", { signal });
}
