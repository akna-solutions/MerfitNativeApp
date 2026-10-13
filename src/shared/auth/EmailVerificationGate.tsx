import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { goToEmailVerificationAfterAuth } from "./navigation";
import { useEmailVerificationState } from "./useEmailVerificationState";

/** Oturum acik ve dogrulanmamis olsa da acik kalabilen ekranlar (giris/kayit ve hesap ekranlari). */
const OPEN_SECTIONS = new Set(["auth", "onboarding", "welcome", "login"]);

/**
 * E-posta dogrulanmadan uygulamaya devam edilemez: oturum acik ve e-posta dogrulanmamissa
 * (giris/kayit yaniti ya da GET /api/profile), kullanici hangi ekrandaysa dogrulama kodu ekranina
 * yonlendirilir. Durum henuz bilinmiyorsa (null) yonlendirme yapilmaz.
 */
export function EmailVerificationGate() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const { isSignedIn, emailConfirmed } = useEmailVerificationState();

  const section = segments[0] === "pages" ? segments[1] : segments[0];
  const isOpenRoute = segments.length === 0 || (section !== undefined && OPEN_SECTIONS.has(section));

  useEffect(() => {
    if (isSignedIn && emailConfirmed === false && !isOpenRoute) {
      goToEmailVerificationAfterAuth(router);
    }
  }, [isSignedIn, emailConfirmed, isOpenRoute, router]);

  return null;
}
