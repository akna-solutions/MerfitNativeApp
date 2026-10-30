import { ImperativeRouter } from "expo-router";

import type { InitialCodeState } from "./components/EmailCodeVerification";

type AuthRouter = Pick<ImperativeRouter, "canDismiss" | "dismissAll" | "replace">;

/**
 * Giris/kayit sonrasi ana sayfaya gecer ve gecmisteki welcome/login/onboarding ekranlarini
 * stack'ten atar; boylece geri tusu kullaniciyi tekrar welcome ekranina dondurmez.
 * Yalnizca alisveris icin kayit olmus kullanici (shoppingOnly) MB Shop'a gider; MB Fit'i actiginda
 * once fitness profilini tamamlar (bkz. FitnessProfileGate).
 */
export function goToDashboardAfterAuth(router: AuthRouter, options: { shoppingOnly?: boolean } = {}) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(options.shoppingOnly ? "/pages/store" : "/pages/dashboard");
}

/**
 * Dogrulanmamis e-postayla giris/kayittan sonra kod ekranini acar (ayni stack temizligiyle).
 * E-posta dogrulanmadan uygulamaya gecilemez (bkz. EmailVerificationGate).
 */
export function goToEmailVerificationAfterAuth(
  router: AuthRouter,
  options: { codeState?: InitialCodeState; fromRegistration?: boolean; name?: string; shoppingOnly?: boolean } = {},
) {
  if (router.canDismiss()) router.dismissAll();
  router.replace({
    pathname: "/pages/auth/verify-email",
    params: {
      code: options.codeState ?? "notSent",
      ...(options.fromRegistration ? { from: "register", name: options.name ?? "" } : {}),
      ...(options.shoppingOnly ? { shop: "1" } : {}),
    },
  });
}
