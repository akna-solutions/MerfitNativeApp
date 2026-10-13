import { ImperativeRouter } from "expo-router";

import type { InitialCodeState } from "./components/EmailCodeVerification";

type AuthRouter = Pick<ImperativeRouter, "canDismiss" | "dismissAll" | "replace">;

/**
 * Giris/kayit sonrasi ana sayfaya gecer ve gecmisteki welcome/login/onboarding ekranlarini
 * stack'ten atar; boylece geri tusu kullaniciyi tekrar welcome ekranina dondurmez.
 */
export function goToDashboardAfterAuth(router: AuthRouter) {
  if (router.canDismiss()) router.dismissAll();
  router.replace("/pages/dashboard");
}

/**
 * Dogrulanmamis e-postayla giris/kayittan sonra kod ekranini acar (ayni stack temizligiyle).
 * E-posta dogrulanmadan uygulamaya gecilemez (bkz. EmailVerificationGate).
 */
export function goToEmailVerificationAfterAuth(
  router: AuthRouter,
  options: { codeState?: InitialCodeState; fromRegistration?: boolean; name?: string } = {},
) {
  if (router.canDismiss()) router.dismissAll();
  router.replace({
    pathname: "/pages/auth/verify-email",
    params: {
      code: options.codeState ?? "notSent",
      ...(options.fromRegistration ? { from: "register", name: options.name ?? "" } : {}),
    },
  });
}
