import { isApiError, NetworkError } from "../../services/api/client";

/** API/ag hatasini kullaniciya gosterilecek tek satirlik metne cevirir (LoginScreen ile ayni kurallar). */
export function toUserMessage(error: unknown, fallback: string): string {
  if (error instanceof NetworkError) {
    return "Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.";
  }
  if (isApiError(error)) {
    return error.message || fallback;
  }
  return fallback;
}

/** 429 yanitindaki Retry-After (saniye); yoksa undefined. */
export function retryAfterSeconds(error: unknown): number | undefined {
  return isApiError(error) && error.status === 429 ? error.retryAfterSeconds : undefined;
}
