import { ImperativeRouter } from "expo-router";

/**
 * Giris/kayit sonrasi ana sayfaya gecer ve gecmisteki welcome/login/onboarding ekranlarini
 * stack'ten atar; boylece geri tusu kullaniciyi tekrar welcome ekranina dondurmez.
 */
export function goToDashboardAfterAuth(router: Pick<ImperativeRouter, "canDismiss" | "dismissAll" | "replace">) {
  if (router.canDismiss()) router.dismissAll();
  router.replace("/pages/dashboard");
}
