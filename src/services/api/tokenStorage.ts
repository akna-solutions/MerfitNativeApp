import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// JWT access/refresh token ciftini cihazin guvenli deposunda (iOS Keychain / Android
// Keystore) saklar. Web ortaminda SecureStore desteklenmedigi icin localStorage'a duser.
const ACCESS_TOKEN_KEY = "merfit.accessToken";
const REFRESH_TOKEN_KEY = "merfit.refreshToken";

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

const isWeb = Platform.OS === "web";

export async function getStoredTokens(): Promise<StoredTokens | null> {
  if (isWeb) {
    try {
      if (typeof window === "undefined" || !window.localStorage) return null;
      const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!accessToken || !refreshToken) return null;
      return { accessToken, refreshToken };
    } catch {
      return null;
    }
  }

  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);

    if (!accessToken || !refreshToken) {
      return null;
    }

    return { accessToken, refreshToken };
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  if (isWeb) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
    } catch {}
    return;
  }

  try {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  } catch (error) {
    console.warn("SecureStore token kaydetme hatasi:", error);
  }
}

export async function clearTokens(): Promise<void> {
  if (isWeb) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch {}
    return;
  }

  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  } catch (error) {
    console.warn("SecureStore token temizleme hatasi:", error);
  }
}
