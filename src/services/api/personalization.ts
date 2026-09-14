import { apiRequest } from "./client";
import { PersonalizationStatusResponse } from "./types";

/**
 * GET /api/personalization/status - kayit sirasinda olusturulan PersonalizationJob'un
 * (arka planda antrenman + beslenme programi uretimi) guncel durumunu getirir.
 */
export async function getPersonalizationStatus(
  signal?: AbortSignal,
): Promise<PersonalizationStatusResponse> {
  return apiRequest<PersonalizationStatusResponse>("/api/personalization/status", { signal });
}
