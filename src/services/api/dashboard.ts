import { apiRequest } from "./client";
import { DashboardResponse } from "./types";

/** GET /api/dashboard - giris yapmis kullanicinin DashboardScreen verisini getirir. */
export async function getDashboard(signal?: AbortSignal): Promise<DashboardResponse> {
  return apiRequest<DashboardResponse>("/api/dashboard", { signal });
}
