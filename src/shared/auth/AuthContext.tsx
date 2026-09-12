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
import { LoginRequest } from "../../services/api/types";

type AuthStatus = "loading" | "signedIn" | "signedOut";

type AuthContextValue = {
  status: AuthStatus;
  userName: string | null;
  login: (request: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  /** 401 gibi durumlarda (bkz. services/api/client.ts) token'lar client tarafinda temizlendiginde cagirilir. */
  forceSignOut: () => void;
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

  const login = useCallback(async (request: LoginRequest) => {
    const result = await authApi.login(request);
    setUserName(result.name || result.email);
    setStatus("signedIn");
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUserName(null);
    setStatus("signedOut");
  }, []);

  const forceSignOut = useCallback(() => {
    setUserName(null);
    setStatus("signedOut");
  }, []);

  const value = useMemo(
    () => ({ status, userName, login, logout, forceSignOut }),
    [status, userName, login, logout, forceSignOut],
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
