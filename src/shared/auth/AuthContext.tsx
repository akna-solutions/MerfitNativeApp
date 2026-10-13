import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as authApi from "../../services/api/auth";
import { getStoredTokens } from "../../services/api/tokenStorage";
import { AuthResponse, LoginRequest, RegisterRequest } from "../../services/api/types";
import { deactivateStoredPushToken } from "../notifications/pushRegistration";

type AuthStatus = "loading" | "signedIn" | "signedOut";

type AuthContextValue = {
  status: AuthStatus;
  userName: string | null;
  /** Backend AuthResponse.Username - "@" ONEKI ICERMEZ (bkz. services/api/types.ts). */
  username: string | null;
  /** Giris/kayit yanitindaki e-posta; uygulama soguk acildiysa null (bkz. ProfileContext). */
  email: string | null;
  /**
   * Giris/kayit yanitindaki e-posta dogrulama durumu. Uygulama kayitli token ile soguk acildiysa
   * null'dur; o durumda profil (GET /api/profile emailConfirmed) esas alinir.
   */
  emailConfirmed: boolean | null;
  /** Dogrulama kodu basariyla girildiginde cagrilir. */
  markEmailConfirmed: () => void;
  login: (request: LoginRequest) => Promise<AuthResponse>;
  register: (request: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  /** 401 gibi durumlarda (bkz. services/api/client.ts) token'lar client tarafinda temizlendiginde cagirilir. */
  forceSignOut: () => void;
  /**
   * Her login/register/logout'ta artar. Status zaten "signedIn" iken (orn. suresi dolmus token ile
   * acilip tekrar giris yapildiginda) status degismedigi icin, kullaniciya bagli veriyi yukleyen
   * provider'lar (bkz. ProfileContext) bu sayaci da dinleyerek yeni oturumun verisini ceker.
   */
  sessionVersion: number;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Oturum durumunu uygulama kokunde (bkz. _layout.tsx) tutar; boylece Dashboard/Workouts
 * gibi ekranlar aninda "hangi kullanici giris yapmis" bilgisine erisebilir ve token
 * gecersiz oldugunda tum uygulama tek noktadan login ekranina donebilir.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [userName, setUserName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState<boolean | null>(null);
  const [sessionVersion, setSessionVersion] = useState(0);
  const bumpSession = useCallback(() => setSessionVersion((v) => v + 1), []);

  useEffect(() => {
    let isMounted = true;
    getStoredTokens().then((tokens) => {
      if (!isMounted) return;
      setStatus(tokens ? "signedIn" : "signedOut");
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const applySession = useCallback((result: AuthResponse) => {
    setUserName(result.name || result.email);
    setUsername(result.username || null);
    setEmail(result.email || null);
    setEmailConfirmed(typeof result.emailConfirmed === "boolean" ? result.emailConfirmed : null);
    setStatus("signedIn");
    bumpSession();
  }, [bumpSession]);

  const login = useCallback(async (request: LoginRequest) => {
    const result = await authApi.login(request);
    applySession(result);
    return result;
  }, [applySession]);

  const register = useCallback(async (request: RegisterRequest) => {
    const result = await authApi.register(request);
    applySession(result);
    return result;
  }, [applySession]);

  const markEmailConfirmed = useCallback(() => setEmailConfirmed(true), []);

  const logout = useCallback(async () => {
    // Token'lar silinmeden once bu cihazin push kaydi pasiflestirilir (kimlik dogrulamali istek);
    // backend'e ulasilamazsa cikis yine de tamamlanir.
    await deactivateStoredPushToken("Logout");
    await authApi.logout();
    setUserName(null);
    setUsername(null);
    setEmail(null);
    setEmailConfirmed(null);
    setStatus("signedOut");
    bumpSession();
  }, [bumpSession]);

  const forceSignOut = useCallback(() => {
    setUserName(null);
    setUsername(null);
    setEmail(null);
    setEmailConfirmed(null);
    setStatus("signedOut");
    bumpSession();
  }, [bumpSession]);

  const value = useMemo(
    () => ({
      status, userName, username, email, emailConfirmed, markEmailConfirmed,
      login, register, logout, forceSignOut, sessionVersion,
    }),
    [status, userName, username, email, emailConfirmed, markEmailConfirmed, login, register, logout, forceSignOut, sessionVersion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used within an <AuthProvider>");
  }
  return ctx;
}
