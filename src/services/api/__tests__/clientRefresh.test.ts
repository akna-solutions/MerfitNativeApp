import { ApiError, apiRequest, NetworkError } from "../client";
import { clearTokens, getStoredTokens, saveTokens } from "../tokenStorage";

jest.mock("../config", () => ({ API_BASE_URL: "https://api.example.test", API_TIMEOUT_MS: 1000 }));

let mockStored: { accessToken: string; refreshToken: string } | null = null;
jest.mock("../tokenStorage", () => ({
  getStoredTokens: jest.fn(async () => mockStored),
  saveTokens: jest.fn(async (tokens: { accessToken: string; refreshToken: string }) => {
    mockStored = tokens;
  }),
  clearTokens: jest.fn(async () => {
    mockStored = null;
  }),
}));

const originalFetch = globalThis.fetch;

function jsonResponse(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

type Call = { url: string; auth?: string; body?: string };

/** /api/auth/refresh disindaki isteklerde yalnizca "access-new" token'ini kabul eden sahte sunucu. */
function fakeServer(refresh: () => Response | Promise<Response>) {
  const calls: Call[] = [];
  globalThis.fetch = jest.fn(async (url: string, init: { headers: Record<string, string>; body?: string }) => {
    calls.push({ url, auth: init.headers.Authorization, body: init.body });
    if (url.endsWith("/api/auth/refresh")) return refresh();
    return init.headers.Authorization === "Bearer access-new" ? jsonResponse(200, { ok: true }) : jsonResponse(401);
  }) as never;
  return calls;
}

describe("apiRequest sessiz oturum yenileme", () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockStored = { accessToken: "access-old", refreshToken: "refresh-old" };
    jest.clearAllMocks();
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    errorSpy.mockRestore();
  });

  it("401'de token'i yeniler, kaydeder ve istegi tekrarlar", async () => {
    const calls = fakeServer(() => jsonResponse(200, { accessToken: "access-new", refreshToken: "refresh-new" }));

    await expect(apiRequest("/api/dashboard")).resolves.toEqual({ ok: true });

    expect(calls.map((c) => c.url.replace("https://api.example.test", ""))).toEqual([
      "/api/dashboard",
      "/api/auth/refresh",
      "/api/dashboard",
    ]);
    expect(JSON.parse(calls[1].body!)).toEqual({ refreshToken: "refresh-old" });
    expect(saveTokens).toHaveBeenCalledWith({ accessToken: "access-new", refreshToken: "refresh-new" });
    expect(clearTokens).not.toHaveBeenCalled();
  });

  it("ayni anda 401 alan istekler tek bir yenileme yapar", async () => {
    const calls = fakeServer(() => jsonResponse(200, { accessToken: "access-new", refreshToken: "refresh-new" }));

    await Promise.all([apiRequest("/api/a"), apiRequest("/api/b"), apiRequest("/api/c")]);

    expect(calls.filter((c) => c.url.endsWith("/api/auth/refresh"))).toHaveLength(1);
  });

  it("refresh token reddedilirse token'lari temizler ve 401 firlatir", async () => {
    fakeServer(() => jsonResponse(401));

    const request = apiRequest("/api/dashboard");
    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ status: 401 });
    expect(clearTokens).toHaveBeenCalled();
    expect(await getStoredTokens()).toBeNull();
  });

  it("yenileme sunucuya ulasamazsa oturumu kapatmaz", async () => {
    fakeServer(() => {
      throw new Error("network down");
    });

    await expect(apiRequest("/api/dashboard")).rejects.toBeInstanceOf(NetworkError);
    expect(clearTokens).not.toHaveBeenCalled();
    expect(mockStored).toEqual({ accessToken: "access-old", refreshToken: "refresh-old" });
  });

  it("skipAuth isteklerinde (orn. hatali parola) yenileme denemez", async () => {
    const calls = fakeServer(() => jsonResponse(200, { accessToken: "access-new", refreshToken: "refresh-new" }));

    await expect(apiRequest("/api/auth/login", { method: "POST", body: {}, skipAuth: true })).rejects.toMatchObject({ status: 401 });

    expect(calls).toHaveLength(1);
    expect(clearTokens).not.toHaveBeenCalled();
  });
});
