import { apiRequest } from "./client";
import { ProfileResponse, UpdateProfileRequest } from "./types";

/** GET /api/profile - ProfileContext'in ilk yukleme icin kullandigi tam profil. */
export async function getProfile(signal?: AbortSignal): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>("/api/profile", { signal });
}

/** PUT /api/profile - kismi guncelleme; guncellenmis tam profili doner. */
export async function updateProfile(patch: UpdateProfileRequest): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>("/api/profile", { method: "PUT", body: patch });
}
