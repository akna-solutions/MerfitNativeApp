import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

import { isApiError, NetworkError } from "../../services/api/client";
import type { GoogleProfile } from "../../services/api/types";
import { useAuth } from "./AuthContext";
import { GoogleSignInError, requestGoogleIdToken } from "./googleSignIn";
import { goToDashboardAfterAuth, goToEmailVerificationAfterAuth } from "./navigation";
import { setPendingGoogleSignup } from "./pendingGoogleSignup";

export type GoogleSignInOutcome =
  | { type: "signedIn" }
  | { type: "registrationRequired"; idToken: string; profile: GoogleProfile }
  | { type: "cancelled" }
  | { type: "failed" };

/** Google akisindaki hatalari kullaniciya gosterilecek mesaja cevirir. */
export function googleErrorMessage(error: unknown): string {
  if (error instanceof GoogleSignInError) return error.message;
  if (isApiError(error)) return error.message;
  if (error instanceof NetworkError) {
    return "Sunucuya ulaşılamadı. İnternet bağlantınızı veya backend adresini kontrol edin.";
  }
  return "Google ile giriş yapılamadı. Lütfen tekrar dene.";
}

/**
 * "Google ile devam et" butonlari (giris ekrani ve onboarding'in hesap adimi) icin ortak akis:
 * Google hesap secici -> POST /api/auth/google.
 * - Hesap varsa oturum acilir ve kullanici ana sayfaya (e-posta dogrulanmamissa kod ekranina) gecer.
 * - Hesap yoksa Google kimligi bellekte saklanir ve sonuc cagirana doner; cagiran onboarding'e gecer veya
 *   onboarding zaten doluysa kaydi tamamlar.
 */
export function useGoogleSignIn() {
  const router = useRouter();
  const { googleSignIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const start = useCallback(async (): Promise<GoogleSignInOutcome> => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const idToken = await requestGoogleIdToken();
      if (!idToken) {
        return { type: "cancelled" };
      }

      const result = await googleSignIn(idToken);
      if (result.auth) {
        const shoppingOnly = result.auth.fitnessProfileCompleted === false;
        if (result.auth.emailConfirmed === false) {
          goToEmailVerificationAfterAuth(router, { shoppingOnly });
        } else {
          goToDashboardAfterAuth(router, { shoppingOnly });
        }
        return { type: "signedIn" };
      }

      const profile = result.profile ?? { email: "" };
      setPendingGoogleSignup({ idToken, profile });
      return { type: "registrationRequired", idToken, profile };
    } catch (error) {
      console.error("Google ile giriş hatası:", error);
      setErrorMessage(googleErrorMessage(error));
      return { type: "failed" };
    } finally {
      setIsLoading(false);
    }
  }, [googleSignIn, router]);

  return { start, isLoading, errorMessage, setErrorMessage };
}
