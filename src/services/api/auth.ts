import { apiRequest } from "./client";
import { clearTokens, saveTokens } from "./tokenStorage";
import {
  AccountActionResponse,
  AuthResponse,
  ConfirmEmailResponse,
  GoogleRegisterRequest,
  GoogleSignInResponse,
  LoginRequest,
  RegisterRequest,
  ResendVerificationEmailResponse,
  ResetPasswordRequest,
  UsernameAvailabilityResponse,
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

/**
 * POST /api/auth/google - Google ID token'i ile giris. Hesap varsa token cifti kaydedilir; yoksa
 * registrationRequired=true doner ve hicbir sey kaydedilmez (uygulama onboarding'e gecer).
 */
export async function googleSignIn(idToken: string): Promise<GoogleSignInResponse> {
  const result = await apiRequest<GoogleSignInResponse>("/api/auth/google", {
    method: "POST",
    body: { idToken },
    skipAuth: true,
  });

  if (result.auth) {
    await saveTokens({
      accessToken: result.auth.accessToken,
      refreshToken: result.auth.refreshToken,
    });
  }
  return result;
}

/**
 * POST /api/auth/google/register - onboarding'in son adimi (Google ile). Hesap bu arada olusmussa backend
 * yeni hesap acmadan giris yapar (isNewUser=false). Her iki durumda da token'lar kaydedilir.
 */
export async function googleRegister(request: GoogleRegisterRequest): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>("/api/auth/google/register", {
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
// Kodlar e-postayla gelir ve kullanici tarafindan girilir; hicbir yerde loglanmaz veya saklanmaz.

/** POST /api/auth/email-verification/resend - giris yapmis kullaniciya yeni 6 haneli dogrulama kodu. */
export function resendVerificationEmail(): Promise<ResendVerificationEmailResponse> {
  return apiRequest<ResendVerificationEmailResponse>("/api/auth/email-verification/resend", { method: "POST" });
}

/** POST /api/auth/email-verification/confirm - giris yapmis kullanicinin dogrulama kodunu kontrol eder. */
export function confirmEmail(code: string): Promise<ConfirmEmailResponse> {
  return apiRequest<ConfirmEmailResponse>("/api/auth/email-verification/confirm", {
    method: "POST",
    body: { code },
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

/** POST /api/auth/password/reset/verify-code - kodu kullanmadan kontrol eder (bir deneme hakki harcar). */
export function verifyPasswordResetCode(email: string, code: string): Promise<AccountActionResponse> {
  return apiRequest<AccountActionResponse>("/api/auth/password/reset/verify-code", {
    method: "POST",
    body: { email, code },
    skipAuth: true,
  });
}

/** POST /api/auth/password/reset - e-posta + kod ile yeni sifreyi kaydeder; sunucu tum oturumlari kapatir. */
export function resetPassword(request: ResetPasswordRequest): Promise<AccountActionResponse> {
  return apiRequest<AccountActionResponse>("/api/auth/password/reset", {
    method: "POST",
    body: request,
    skipAuth: true,
  });
}

/** GET /api/auth/username-availability - kayit ekranindaki anlik kullanici adi kontrolu. */
export function checkUsernameAvailability(username: string, signal?: AbortSignal): Promise<UsernameAvailabilityResponse> {
  return apiRequest<UsernameAvailabilityResponse>("/api/auth/username-availability", {
    query: { username },
    skipAuth: true,
    signal,
  });
}
