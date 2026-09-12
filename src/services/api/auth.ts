import { apiRequest } from "./client";
import { clearTokens, saveTokens } from "./tokenStorage";
import { AuthResponse, LoginRequest } from "./types";

/** POST /api/auth/login - basarili olursa token cifti SecureStore'a kaydedilir. */
export async function login(request: LoginRequest): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: request,
    skipAuth: true,
  });

  await saveTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
  return result;
}

/** Cihazdaki token'lari temizler (backend'de bir /auth/logout uc noktasi olmadigindan yalnizca client-side). */
export async function logout(): Promise<void> {
  await clearTokens();
}
