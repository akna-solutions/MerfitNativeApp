import { API_BASE_URL, API_TIMEOUT_MS } from "./config";
import { clearTokens, getStoredTokens } from "./tokenStorage";

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

  constructor(status: number, message: string, fieldErrors: string[] = [], traceId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.traceId = traceId;
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
};

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

/**
 * MerfitCustomerApi'ye JSON istegi atar; Authorization header'ini otomatik ekler,
 * hata govdesini ApiError'a cevirir ve 401 durumunda saklanan token'lari temizler.
 */
export async function apiRequest<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const { method = "GET", body, query, skipAuth = false, signal } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (!skipAuth) {
    const tokens = await getStoredTokens();
    if (tokens?.accessToken) {
      headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let response: Response;
  const targetUrl = buildUrl(path, query);
  try {
    response = await fetch(targetUrl, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    console.error(`[API Hatası] ${method} ${targetUrl} adresine erişilemedi:`, error);
    if ((error as Error).name === "AbortError") {
      throw new NetworkError(`İstek zaman aşımına uğradı (${targetUrl}). Lütfen tekrar deneyin.`);
    }
    throw new NetworkError(`Sunucuya ulaşılamadı (${targetUrl}). İnternet bağlantınızı ve backend adresini kontrol edin.`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  if (!response.ok) {
    const errorBody = await parseErrorBody(response);

    if (response.status === 401 && !skipAuth) {
      // Access token gecersiz/suresi dolmus. Backend'de henuz bir /auth/refresh uc noktasi
      // olmadigindan (bkz. FINAL RAPOR - Remaining Work) sessiz yenileme yapamiyoruz;
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

    throw new ApiError(
      response.status,
      message,
      fieldErrors,
      errorBody.traceId,
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
    default:
      return "Beklenmeyen bir hata olustu. Lutfen daha sonra tekrar deneyin.";
  }
}
