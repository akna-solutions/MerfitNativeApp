import { apiRequest } from "./client";
import { FitnessProfileRequest, ProfileResponse, UpdateProfileRequest } from "./types";

/** GET /api/profile - ProfileContext'in ilk yukleme icin kullandigi tam profil. */
export async function getProfile(signal?: AbortSignal): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>("/api/profile", { signal });
}

/** PUT /api/profile - kismi guncelleme; guncellenmis tam profili doner. */
export async function updateProfile(patch: UpdateProfileRequest): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>("/api/profile", { method: "PUT", body: patch });
}

/**
 * POST /api/profile/fitness - yalnizca alisveris icin kayit olmus kullanicinin fitness profilini (onboarding'in
 * boy/kilo/hedef/antrenman adimlari) tamamlar; guncel profili doner. Profil zaten tamamsa 409.
 */
export async function completeFitnessProfile(request: FitnessProfileRequest): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>("/api/profile/fitness", { method: "POST", body: request });
}
