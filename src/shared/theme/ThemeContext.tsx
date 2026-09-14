import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useColorScheme } from "react-native";

import * as themeStorage from "../../services/theme/themeStorage";
import { useAuth } from "../auth/AuthContext";
import { INITIAL_PROFILE_DATA } from "../profile/mockData";
import { useProfile } from "../profile/ProfileContext";
import { AppearanceMode } from "../profile/types";
import { ResolvedScheme, ThemeTokens, tokensFor } from "./tokens";

type ThemeContextValue = {
  /** Kullanicinin sectigi mod: "system" | "light" | "dark". */
  mode: AppearanceMode;
  /** "system" cozumlendikten sonraki gercek gorunum. */
  resolvedScheme: ResolvedScheme;
  colors: ThemeTokens;
  isDark: boolean;
  /** UI'i aninda gunceller, local olarak kalici hale getirir ve arka planda API'ye senkronize eder. */
  setThemeMode: (mode: AppearanceMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Uygulama genelinde tek theme kaynagi. _layout.tsx'te ProfileProvider'in icinde,
 * Stack'in disinda konumlanir ki tum ekranlar useTheme() ile ayni degerlere erisebilsin.
 *
 * Akis:
 * 1) Mount'ta local olarak son secilen mod SecureStore/localStorage'dan okunur (offline/hizli acilis).
 * 2) Kullanici login olup profil (GET /api/profile) yuklendiginde, backend'deki theme tercihi
 *    kaynak olarak alinir ve local depoya yazilir (bkz. AGENTS.md madde 12).
 * 3) Kullanici Settings'ten mod degistirdiginde: state aninda guncellenir (UI hemen degisir),
 *    local depoya yazilir, ve mevcut ProfileContext.updateProfile uzerinden PUT /api/profile'a
 *    (appearance alani) gonderilir - ayri bir API cagrisi eklemek yerine zaten var olan
 *    optimistic-update + sessiz hata toleransi deseni yeniden kullanilir.
 * 4) Logout'ta (bkz. madde 13) bir onceki kullanicinin tercihi sizmasin diye local depo
 *    temizlenir ve mod "system"e doner.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { profile, updateProfile, isLoading: isProfileLoading } = useProfile();
  const deviceScheme = useColorScheme();

  const [mode, setModeState] = useState<AppearanceMode>("system");
  const wasProfileLoadingRef = useRef(false);

  // 1) Ilk acilista local olarak son secilen modu yukle.
  useEffect(() => {
    let isMounted = true;
    themeStorage.getStoredThemeMode().then((stored) => {
      if (isMounted && stored) setModeState(stored);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2) Profil yuklendiginde (login veya mevcut oturumla acilis) backend'deki tercihi esas al.
  // NOT: GET /api/profile basarisiz olursa ProfileContext hatayi sessizce yutar ve `profile`
  // INITIAL_PROFILE_DATA referansinda kalir (bkz. ProfileContext.tsx) - bu durumda local/son
  // bilinen tercihi ezmiyoruz (offline/API erisilemez senaryosu, bkz. AGENTS.md madde 14).
  useEffect(() => {
    const fetchJustCompleted = status === "signedIn" && wasProfileLoadingRef.current && !isProfileLoading;
    const fetchSucceeded = (profile as typeof INITIAL_PROFILE_DATA) !== INITIAL_PROFILE_DATA;
    if (fetchJustCompleted && fetchSucceeded) {
      setModeState(profile.appearance);
      themeStorage.setStoredThemeMode(profile.appearance);
    }
    wasProfileLoadingRef.current = isProfileLoading;
  }, [status, isProfileLoading, profile]);

  // 4) Logout: bir sonraki kullaniciya onceki tercih tasinmasin.
  useEffect(() => {
    if (status === "signedOut") {
      setModeState("system");
      themeStorage.clearStoredThemeMode();
    }
  }, [status]);

  // 3) Kullanicinin secimi: aninda UI + local persistence + arka planda API senkronizasyonu.
  const setThemeMode = useCallback(
    (next: AppearanceMode) => {
      setModeState(next);
      themeStorage.setStoredThemeMode(next);
      updateProfile({ appearance: next });
    },
    [updateProfile],
  );

  const resolvedScheme: ResolvedScheme = useMemo(() => {
    if (mode === "system") {
      return deviceScheme === "light" ? "light" : "dark";
    }
    return mode;
  }, [mode, deviceScheme]);

  const colors = useMemo(() => tokensFor(resolvedScheme), [resolvedScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolvedScheme, colors, isDark: resolvedScheme === "dark", setThemeMode }),
    [mode, resolvedScheme, colors, setThemeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme() must be used within a <ThemeProvider>");
  }
  return ctx;
}
