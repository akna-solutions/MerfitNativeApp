import { apiRequest, NetworkError } from "../client";

jest.mock("../config", () => ({ API_BASE_URL: "https://api.example.test", API_TIMEOUT_MS: 50 }));
jest.mock("../tokenStorage", () => ({ getStoredTokens: jest.fn(async () => null), clearTokens: jest.fn() }));

const originalFetch = globalThis.fetch;

/** Sinyal iptal edilene kadar bekleyen, iptalde expo/fetch gibi duz bir Error firlatan sahte fetch. */
function hangingFetch() {
  return jest.fn(
    (_url: string, init: { signal: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(new Error("fetch failed: Fetch request has been canceled")));
      }),
  );
}

describe("apiRequest iptal ve zaman asimi", () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    errorSpy.mockRestore();
  });

  it("cagiran iptal ettiginde hata loglamaz ve AbortError firlatir", async () => {
    globalThis.fetch = hangingFetch() as never;
    const controller = new AbortController();
    const request = apiRequest("/api/store/cart", { signal: controller.signal });
    await Promise.resolve();
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
    await expect(request).rejects.not.toBeInstanceOf(NetworkError);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("zaman asiminda loglar ve NetworkError firlatir", async () => {
    globalThis.fetch = hangingFetch() as never;
    const request = apiRequest("/api/store/cart");
    await expect(request).rejects.toBeInstanceOf(NetworkError);
    await expect(request).rejects.toThrow(/zaman aşımı/);
    expect(errorSpy).toHaveBeenCalled();
  });
});
