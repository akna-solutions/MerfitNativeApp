/**
 * Bildirim verisindeki "screen" anahtarini uygulama icindeki sabit bir rotaya cevirir.
 * Backend (bkz. MerfitCustomerApi NotificationNavigation) yalnizca bu listedeki ekran adlarini
 * kabul eder; burada da ayni liste disindaki her deger (URL, bilinmeyen ekran, bos) yok sayilir,
 * boylece push verisi uygulamayi rastgele bir rotaya ya da dis baglantiya goturemez.
 */
const SCREEN_ROUTES = {
  dashboard: "/pages/dashboard",
  nutrition: "/pages/nutrition",
  workouts: "/pages/workouts",
  workoutPlan: "/pages/workout/plan",
  progress: "/pages/progress",
  leaderboard: "/pages/leaderboard",
  notifications: "/pages/notifications",
  profile: "/pages/profile",
  subscription: "/pages/profile/subscription",
} as const;

export type NotificationScreen = keyof typeof SCREEN_ROUTES;

export function resolveNotificationRoute(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const screen = (data as Record<string, unknown>).screen;
  if (typeof screen !== "string") return null;
  return Object.prototype.hasOwnProperty.call(SCREEN_ROUTES, screen)
    ? SCREEN_ROUTES[screen as NotificationScreen]
    : null;
}

/** Push verisindeki bildirim kimligi (gelen kutusundaki kayit); gecersizse null. */
export function parseNotificationId(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const raw = (data as Record<string, unknown>).notificationId;
  const id = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
