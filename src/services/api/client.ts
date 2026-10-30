import { API_BASE_URL, API_TIMEOUT_MS } from "./config";
import { clearTokens, getStoredTokens, saveTokens } from "./tokenStorage";

// Backend'in global exception middleware'i hata govdelerini bu sekilde doner
// (bkz. MerfitCustomerApi.Business.Common.Responses.ApiResponse). Basarili customer
// uc noktalari (Auth/Dashboard/Workouts) DTO'yu dogrudan doner, bu zarfi kullanmaz.
type ApiErrorBody = {
  isSuccess?: boolean;
  errorMessage?: string;
  message?: string;
  title?: string;
  errors?: string[] | Record<string, string[]>;
  traceId?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: string[];
  readonly traceId?: string;
  /** 429/503 yanitlarindaki Retry-After basligi (saniye); yoksa undefined. */
  readonly retryAfterSeconds?: number;

  constructor(status: number, message: string, fieldErrors: string[] = [], traceId?: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.traceId = traceId;
    this.retryAfterSeconds = retryAfterSeconds;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** Token gecersiz/suresi dolmus - cagiran taraf kullaniciyi login ekranina yonlendirmeli. */
  get isUnauthorized() {
    return this.status === 401;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError ||
    (error instanceof Error && error.name === "ApiError") ||
    (typeof error === "object" && error !== null && "status" in error && "message" in error)
  );
}

/** Ag hatasi / zaman asimi gibi backend'e hic ulasamama durumlari icin. */
export class NetworkError extends Error {
  constructor(message = "Sunucuya ulasilamadi. Internet baglantinizi kontrol edin.") {
    super(message);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Bu istek icin Authorization header'i EKLENMEZ (orn. login/register). Varsayilan: false. */
  skipAuth?: boolean;
  signal?: AbortSignal;
  /** Bu istek icin zaman asimi (ms). Varsayilan: API_TIMEOUT_MS. Yapay zeka yanitlari gibi yavas uclar icin. */
  timeoutMs?: number;
};

function abortError(): Error {
  const error = new Error("İstek iptal edildi.");
  error.name = "AbortError";
  return error;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return {};
  }
}

type RefreshOutcome = { accessToken: string; refreshToken: string } | "invalid" | "unavailable";

// Ayni anda 401 alan istekler tek bir yenileme istegini paylasir; refresh token rotasyonlu oldugu icin
// ayni token'la iki yenileme yapilmamali.
let refreshInFlight: Promise<RefreshOutcome> | null = null;

async function requestNewTokens(refreshToken: string): Promise<RefreshOutcome> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(buildUrl("/api/auth/refresh"), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal,
    });
    if (response.status === 400 || response.status === 401) {
      return "invalid";
    }
    if (!response.ok) {
      return "unavailable";
    }
    const result = (await response.json()) as { accessToken?: string; refreshToken?: string };
    if (!result.accessToken || !result.refreshToken) {
      return "unavailable";
    }
    const tokens = { accessToken: result.accessToken, refreshToken: result.refreshToken };
    await saveTokens(tokens);
    return tokens;
  } catch {
    return "unavailable";
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Access token'in suresi doldugunda (401) refresh token ile yeni token cifti alir. Istek gonderilirken baska bir
 * cagri token'lari zaten yenilediyse saklanan yeni cift kullanilir. "invalid": oturum gercekten bitti (refresh
 * token suresi dolmus/iptal); "unavailable": sunucuya ulasilamadi, oturum korunur.
 */
async function refreshSession(usedRefreshToken: string): Promise<RefreshOutcome> {
  const latest = await getStoredTokens();
  if (!latest) {
    return "invalid";
  }
  if (latest.refreshToken !== usedRefreshToken) {
    return latest;
  }
  if (!refreshInFlight) {
    refreshInFlight = requestNewTokens(latest.refreshToken).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/**
 * MerfitCustomerApi'ye JSON (ya da FormData ile multipart) istegi atar; Authorization header'ini otomatik ekler ve
 * hata govdesini ApiError'a cevirir. 401 alinirsa refresh token ile oturumu sessizce yenileyip istegi bir kez
 * tekrarlar; yenileme reddedilirse (oturum bitti) saklanan token'lari temizler.
 */
export async function apiRequest<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const { method = "GET", body, query, skipAuth = false, signal, timeoutMs = API_TIMEOUT_MS } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  // FormData (dosya yukleme) govdesinde Content-Type'i fetch belirler (multipart boundary dahil).
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const tokens = skipAuth ? null : await getStoredTokens();
  if (tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  const targetUrl = buildUrl(path, query);
  const send = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    if (signal) {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    try {
      return await fetch(targetUrl, {
        method,
        headers,
        body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      // Cagiran istegi kendisi iptal ettiyse (ekran kapandi, oturum degisti) bu bir hata degildir:
      // loglanmaz ve AbortError olarak iletilir; cagiran taraf iptal edilen yaniti zaten yok sayar.
      if (signal?.aborted) {
        throw abortError();
      }
      console.error(`[API Hatası] ${method} ${targetUrl} adresine erişilemedi:`, error);
      if (controller.signal.aborted || (error as Error).name === "AbortError") {
        throw new NetworkError(`İstek zaman aşımına uğradı (${targetUrl}). Lütfen tekrar deneyin.`);
      }
      throw new NetworkError(`Sunucuya ulaşılamadı (${targetUrl}). İnternet bağlantınızı ve backend adresini kontrol edin.`);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  let response = await send();
  let sessionEnded = false;

  if (response.status === 401 && tokens?.refreshToken) {
    const refreshed = await refreshSession(tokens.refreshToken);
    if (refreshed === "unavailable") {
      // Yenileme sunucuya ulasamadi: oturum kapatilmaz, kullanici baglanti gelince devam eder.
      throw new NetworkError("Oturum yenilenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    }
    if (refreshed === "invalid") {
      sessionEnded = true;
    } else {
      if (signal?.aborted) {
        throw abortError();
      }
      headers.Authorization = `Bearer ${refreshed.accessToken}`;
      response = await send();
      sessionEnded = response.status === 401;
    }
  } else if (response.status === 401 && !skipAuth) {
    sessionEnded = true;
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  if (!response.ok) {
    const errorBody = await parseErrorBody(response);

    if (sessionEnded) {
      // Refresh token da gecersiz (10 gun hic girilmedi, cikis yapildi veya sifre sifirlandi):
      // kullaniciyi tekrar giris yapmaya yonlendirmek icin token'lari temizliyoruz.
      await clearTokens();
    }

    let fieldErrors: string[] = [];
    if (Array.isArray(errorBody.errors)) {
      fieldErrors = errorBody.errors;
    } else if (errorBody.errors && typeof errorBody.errors === "object") {
      fieldErrors = Object.values(errorBody.errors).flat();
    }

    const message =
      errorBody.errorMessage ??
      (fieldErrors.length > 0 ? fieldErrors[0] : undefined) ??
      errorBody.message ??
      errorBody.title ??
      defaultMessageForStatus(response.status);

    const retryAfter = Number(response.headers?.get?.("Retry-After"));
    throw new ApiError(
      response.status,
      message,
      fieldErrors,
      errorBody.traceId,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    );
  }

  const text = await response.text();
  if (!text) {
    return undefined as TResponse;
  }
  return JSON.parse(text) as TResponse;
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "Gonderilen bilgiler gecersiz.";
    case 401:
      return "Oturumunuzun suresi doldu. Lutfen tekrar giris yapin.";
    case 403:
      return "Bu islem icin yetkiniz yok.";
    case 404:
      return "Aranan kayit bulunamadi.";
    case 409:
      return "Islem mevcut bir kayitla cakisiyor.";
    case 429:
      return "Çok fazla deneme yaptın. Lütfen biraz bekleyip tekrar dene.";
    case 503:
      return "Servis şu anda kullanılamıyor. Lütfen biraz sonra tekrar dene.";
    default:
      return "Beklenmeyen bir hata olustu. Lutfen daha sonra tekrar deneyin.";
  }
}
