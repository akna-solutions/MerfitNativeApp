import { Platform } from "react-native";

/**
 * Google Sign-In (cihazdaki yerel Google hesap secici) ile ID token alma.
 *
 * Istemci kimlikleri .env / EAS ortam degiskenlerinden okunur (gizli degildir ama ortama gore degisir):
 * - EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: Google Cloud Console'daki "Web application" istemcisi. ID token'in
 *   "aud" alani bu olur; backend GoogleAuth:ClientIds ile ayni deger olmalidir.
 * - EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: "iOS" istemcisi (iOS'ta zorunlu). URL scheme'i app.config.ts uretir.
 *
 * Yerel modul Expo Go'da yoktur (development build gerekir); bu yuzden modul ilk kullanimda yuklenir ve
 * yoksa kullaniciya acik bir mesaj gosterilir, uygulamanin geri kalani etkilenmez.
 */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || "";
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || "";

export const GOOGLE_UNAVAILABLE_MESSAGE = "Google ile giriş şu anda kullanılamıyor.";

/** Kullaniciya gosterilebilecek mesajla Google Sign-In hatasi. */
export class GoogleSignInError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleSignInError";
    Object.setPrototypeOf(this, GoogleSignInError.prototype);
  }
}

type GoogleSigninModule = typeof import("@react-native-google-signin/google-signin");

let cachedModule: GoogleSigninModule | null | undefined;
let configured = false;

function loadModule(): GoogleSigninModule | null {
  if (cachedModule === undefined) {
    try {
      cachedModule = require("@react-native-google-signin/google-signin") as GoogleSigninModule;
    } catch (error) {
      console.warn("Google Sign-In yerel modulu yuklenemedi (Expo Go?):", error);
      cachedModule = null;
    }
  }
  return cachedModule;
}

export function isGoogleSignInConfigured(): boolean {
  return WEB_CLIENT_ID.length > 0 && (Platform.OS !== "ios" || IOS_CLIENT_ID.length > 0);
}

function getConfiguredModule(): GoogleSigninModule {
  const mod = isGoogleSignInConfigured() ? loadModule() : null;
  if (!mod) {
    throw new GoogleSignInError(GOOGLE_UNAVAILABLE_MESSAGE);
  }
  if (!configured) {
    mod.GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      ...(IOS_CLIENT_ID ? { iosClientId: IOS_CLIENT_ID } : {}),
      // Yalnizca kimlik (openid email profile); Google API'lerine erisim istenmez.
      offlineAccess: false,
    });
    configured = true;
  }
  return mod;
}

function toGoogleSignInError(mod: GoogleSigninModule, error: unknown): GoogleSignInError {
  if (mod.isErrorWithCode(error)) {
    switch (error.code) {
      case mod.statusCodes.IN_PROGRESS:
        return new GoogleSignInError("Google ile giriş zaten sürüyor.");
      case mod.statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return new GoogleSignInError("Bu cihazda Google Play Hizmetleri güncel değil veya yok.");
    }
  }
  console.warn("Google Sign-In hatasi:", error);
  return new GoogleSignInError("Google ile giriş yapılamadı. Lütfen tekrar dene.");
}

/**
 * Google hesap seciciyi acar ve ID token'i doner. Kullanici vazgecerse null doner.
 * @throws GoogleSignInError kullaniciya gosterilecek mesajla
 */
export async function requestGoogleIdToken(): Promise<string | null> {
  const mod = getConfiguredModule();
  try {
    if (Platform.OS === "android") {
      await mod.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    // Her seferinde hesap secici gosterilsin diye onceki secim unutulur (farkli hesapla devam edilebilsin).
    if (mod.GoogleSignin.hasPreviousSignIn()) {
      await mod.GoogleSignin.signOut();
    }
    const response = await mod.GoogleSignin.signIn();
    if (!mod.isSuccessResponse(response)) {
      return null;
    }
    if (!response.data.idToken) {
      // webClientId yanlis/eksikse Google ID token vermez.
      throw new GoogleSignInError(GOOGLE_UNAVAILABLE_MESSAGE);
    }
    return response.data.idToken;
  } catch (error) {
    if (error instanceof GoogleSignInError) throw error;
    if (mod.isErrorWithCode(error) && error.code === mod.statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    throw toGoogleSignInError(mod, error);
  }
}

/**
 * Onboarding uzun surerse (ID token ~1 saat gecerli) kayittan hemen once kullaniciya bir sey sormadan taze
 * token alir. Alinamazsa null doner; cagiran taraf eldeki token'la devam eder.
 */
export async function refreshGoogleIdToken(): Promise<string | null> {
  const mod = isGoogleSignInConfigured() ? loadModule() : null;
  if (!mod) return null;
  try {
    getConfiguredModule();
    const response = await mod.GoogleSignin.signInSilently();
    return response.type === "success" ? response.data.idToken : null;
  } catch {
    return null;
  }
}

/** Cikista cihazdaki Google oturumunu da kapatir; hata cikisi engellemez. */
export async function signOutFromGoogle(): Promise<void> {
  const mod = configured ? loadModule() : null;
  if (!mod) return;
  try {
    await mod.GoogleSignin.signOut();
  } catch (error) {
    console.warn("Google oturumu kapatilamadi:", error);
  }
}
