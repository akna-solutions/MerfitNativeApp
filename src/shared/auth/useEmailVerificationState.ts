import { useCallback } from "react";

import { useProfile } from "../profile/ProfileContext";
import { useAuth } from "./AuthContext";

/**
 * Giris yapmis kullanicinin e-posta adresi ve dogrulama durumu. Giris/kayit yanitindaki bilgi
 * (AuthContext) esas alinir; uygulama kayitli oturumla soguk acildiysa veya kullanici e-postasini
 * profilden degistirdiyse profil (GET /api/profile) kullanilir. Durum bilinmiyorsa emailConfirmed
 * null'dur; bu durumda dogrulama uyarisi gosterilmez.
 */
export function useEmailVerificationState() {
  const auth = useAuth();
  const { profile, isLoaded, reload } = useProfile();

  const profileKnown = isLoaded && typeof profile.emailConfirmed === "boolean";
  const emailChanged =
    profileKnown && auth.email != null && profile.email.trim().toLowerCase() !== auth.email.trim().toLowerCase();

  const email = emailChanged ? profile.email : auth.email ?? (isLoaded && profile.email ? profile.email : null);
  const emailConfirmed = emailChanged
    ? (profile.emailConfirmed as boolean)
    : auth.emailConfirmed ?? (profileKnown ? (profile.emailConfirmed as boolean) : null);

  const { markEmailConfirmed: markAuthConfirmed } = auth;
  const markEmailConfirmed = useCallback(() => {
    markAuthConfirmed();
    reload();
  }, [markAuthConfirmed, reload]);

  return { isSignedIn: auth.status === "signedIn", email, emailConfirmed, markEmailConfirmed };
}
