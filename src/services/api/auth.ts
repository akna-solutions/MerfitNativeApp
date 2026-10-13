import { apiRequest } from "./client";
import { clearTokens, saveTokens } from "./tokenStorage";
import {
  AccountActionResponse,
  AuthResponse,
  ConfirmEmailResponse,
  LoginRequest,
  RegisterRequest,
  ResendVerificationEmailResponse,
  ResetPasswordRequest,
} from "./types";

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

/**
 * POST /api/auth/register - onboarding akisinin son adimi. Backend basarili oldugunda
 * dogrudan kullanilabilir bir token cifti dondurdugu icin (bkz. AuthController.Register)
 * kayittan sonra ayrica login yapmaya gerek yok; login() ile ayni sekilde token'lari kaydediyoruz.
 */
export async function register(
  request: RegisterRequest,
): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>("/api/auth/register", {
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

// ---- E-posta dogrulama / sifre sifirlama ----
// Jetonlar e-postadaki baglantidan gelir; hicbir yerde loglanmaz veya saklanmaz.

/** POST /api/auth/email-verification/resend - giris yapmis kullaniciya yeni dogrulama e-postasi. */
export function resendVerificationEmail(): Promise<ResendVerificationEmailResponse> {
  return apiRequest<ResendVerificationEmailResponse>("/api/auth/email-verification/resend", { method: "POST" });
}

/** POST /api/auth/email-verification/confirm - tek kullanimlik dogrulama jetonunu kullanir. */
export function confirmEmail(token: string): Promise<ConfirmEmailResponse> {
  return apiRequest<ConfirmEmailResponse>("/api/auth/email-verification/confirm", {
    method: "POST",
    body: { token },
    skipAuth: true,
  });
}

/** POST /api/auth/password/forgot - hesap olsun olmasin ayni genel mesaj doner. */
export function requestPasswordReset(email: string): Promise<AccountActionResponse> {
  return apiRequest<AccountActionResponse>("/api/auth/password/forgot", {
    method: "POST",
    body: { email },
    skipAuth: true,
  });
}

/** POST /api/auth/password/reset/validate - baglanti hala gecerli mi (jetonu kullanmaz). */
export function validatePasswordResetToken(token: string): Promise<AccountActionResponse> {
  return apiRequest<AccountActionResponse>("/api/auth/password/reset/validate", {
    method: "POST",
    body: { token },
    skipAuth: true,
  });
}

/** POST /api/auth/password/reset - yeni sifreyi kaydeder; sunucu tum oturumlari kapatir. */
export function resetPassword(request: ResetPasswordRequest): Promise<AccountActionResponse> {
  return apiRequest<AccountActionResponse>("/api/auth/password/reset", {
    method: "POST",
    body: request,
    skipAuth: true,
  });
}
