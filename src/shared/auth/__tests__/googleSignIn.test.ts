/**
 * Google Sign-In sarmalayicisi: yapilandirma kontrolu, basari/vazgecme/hata eslemesi. Yerel modul jest'te taklit
 * edilir; istemci kimlikleri modul yuklenirken okundugu icin her test modulu yeniden yukler.
 */
type Mod = typeof import("../googleSignIn");

const mockGoogleSignin = {
  configure: jest.fn(),
  hasPlayServices: jest.fn(async () => true),
  hasPreviousSignIn: jest.fn(() => false),
  signIn: jest.fn(),
  signInSilently: jest.fn(),
  signOut: jest.fn(async () => null),
};
const mockStatusCodes = { SIGN_IN_CANCELLED: "-5", IN_PROGRESS: "IN_PROGRESS", PLAY_SERVICES_NOT_AVAILABLE: "PSNA", SIGN_IN_REQUIRED: "4" };

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: mockGoogleSignin,
  statusCodes: mockStatusCodes,
  isErrorWithCode: (error: unknown) => typeof error === "object" && error !== null && "code" in error,
  isSuccessResponse: (response: { type: string }) => response.type === "success",
}));

function load(env: { web?: string; ios?: string }, os: "ios" | "android" = "android"): Mod {
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = env.web ?? "";
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = env.ios ?? "";
  let mod: Mod | undefined;
  jest.isolateModules(() => {
    jest.doMock("react-native", () => ({ Platform: { OS: os } }));
    mod = require("../googleSignIn") as Mod;
  });
  return mod!;
}

const nativeError = (code: string) => Object.assign(new Error(code), { code });

beforeEach(() => {
  jest.clearAllMocks();
  mockGoogleSignin.hasPreviousSignIn.mockReturnValue(false);
});

describe("googleSignIn", () => {
  it("istemci kimligi yoksa kullanilamaz der", async () => {
    const mod = load({});
    expect(mod.isGoogleSignInConfigured()).toBe(false);
    await expect(mod.requestGoogleIdToken()).rejects.toThrow("Google ile giriş şu anda kullanılamıyor.");
    expect(mockGoogleSignin.signIn).not.toHaveBeenCalled();
  });

  it("iOS'ta iOS istemci kimligi de zorunlu", () => {
    expect(load({ web: "web.apps.googleusercontent.com" }, "ios").isGoogleSignInConfigured()).toBe(false);
    expect(load({ web: "web.apps.googleusercontent.com", ios: "ios.apps.googleusercontent.com" }, "ios").isGoogleSignInConfigured()).toBe(true);
    expect(load({ web: "web.apps.googleusercontent.com" }, "android").isGoogleSignInConfigured()).toBe(true);
  });

  it("basarili giriste ID token doner ve webClientId ile yapilandirir", async () => {
    const mod = load({ web: "web.apps.googleusercontent.com" });
    mockGoogleSignin.hasPreviousSignIn.mockReturnValue(true);
    mockGoogleSignin.signIn.mockResolvedValue({ type: "success", data: { idToken: "tok" } });

    await expect(mod.requestGoogleIdToken()).resolves.toBe("tok");
    expect(mockGoogleSignin.configure).toHaveBeenCalledWith({ webClientId: "web.apps.googleusercontent.com", offlineAccess: false });
    expect(mockGoogleSignin.hasPlayServices).toHaveBeenCalled();
    // Hesap secici her seferinde gorunsun diye onceki secim unutulur.
    expect(mockGoogleSignin.signOut).toHaveBeenCalled();
  });

  it("kullanici vazgecerse null doner", async () => {
    const mod = load({ web: "web" });
    mockGoogleSignin.signIn.mockResolvedValueOnce({ type: "cancelled", data: null });
    await expect(mod.requestGoogleIdToken()).resolves.toBeNull();

    mockGoogleSignin.signIn.mockRejectedValueOnce(nativeError(mockStatusCodes.SIGN_IN_CANCELLED));
    await expect(mod.requestGoogleIdToken()).resolves.toBeNull();
  });

  it("ID token gelmezse veya Play Hizmetleri yoksa anlasilir hata verir", async () => {
    const mod = load({ web: "web" });
    mockGoogleSignin.signIn.mockResolvedValueOnce({ type: "success", data: { idToken: null } });
    await expect(mod.requestGoogleIdToken()).rejects.toThrow("Google ile giriş şu anda kullanılamıyor.");

    mockGoogleSignin.hasPlayServices.mockRejectedValueOnce(nativeError(mockStatusCodes.PLAY_SERVICES_NOT_AVAILABLE));
    await expect(mod.requestGoogleIdToken()).rejects.toThrow("Bu cihazda Google Play Hizmetleri güncel değil veya yok.");

    mockGoogleSignin.signIn.mockRejectedValueOnce(nativeError("DEVELOPER_ERROR"));
    await expect(mod.requestGoogleIdToken()).rejects.toThrow("Google ile giriş yapılamadı. Lütfen tekrar dene.");
  });

  it("sessiz yenileme basarisizsa null doner", async () => {
    const mod = load({ web: "web" });
    mockGoogleSignin.signInSilently.mockResolvedValueOnce({ type: "success", data: { idToken: "fresh" } });
    await expect(mod.refreshGoogleIdToken()).resolves.toBe("fresh");

    mockGoogleSignin.signInSilently.mockResolvedValueOnce({ type: "noSavedCredentialFound", data: null });
    await expect(mod.refreshGoogleIdToken()).resolves.toBeNull();

    mockGoogleSignin.signInSilently.mockRejectedValueOnce(new Error("x"));
    await expect(mod.refreshGoogleIdToken()).resolves.toBeNull();
  });
});
