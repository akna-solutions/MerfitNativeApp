import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { AppearanceMode } from "../../shared/profile/types";

// tokenStorage.ts ile ayni desen: native'de SecureStore, web'de localStorage.
// Theme tercihi gizli bir bilgi olmadigindan AsyncStorage eklemek yerine
// projede zaten var olan bu deponun ayni yaklasimi tekrar kullanildi.
const THEME_MODE_KEY = "merfit.themeMode";

const isWeb = Platform.OS === "web";

function isAppearanceMode(value: string | null): value is AppearanceMode {
  return value === "system" || value === "light" || value === "dark";
}

export async function getStoredThemeMode(): Promise<AppearanceMode | null> {
  try {
    const value = isWeb
      ? typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem(THEME_MODE_KEY)
        : null
      : await SecureStore.getItemAsync(THEME_MODE_KEY);

    return isAppearanceMode(value) ? value : null;
  } catch {
    return null;
  }
}

export async function setStoredThemeMode(mode: AppearanceMode): Promise<void> {
  try {
    if (isWeb) {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(THEME_MODE_KEY, mode);
      }
      return;
    }
    await SecureStore.setItemAsync(THEME_MODE_KEY, mode);
  } catch {
    // Sessizce yut - theme tercihi kalici olmasa da uygulama calismaya devam eder.
  }
}

export async function clearStoredThemeMode(): Promise<void> {
  try {
    if (isWeb) {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(THEME_MODE_KEY);
      }
      return;
    }
    await SecureStore.deleteItemAsync(THEME_MODE_KEY);
  } catch {
    // Sessizce yut.
  }
}
