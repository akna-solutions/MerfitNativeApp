import type { NotificationApp } from "../../services/api/types";

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
  // MB Shop
  store: "/pages/store",
  storeOrders: "/pages/store/orders",
  storeNotifications: "/pages/store/notifications",
} as const;

/** Kimlik parametresi alan MB Shop ekranlari; kimlik yalnizca rakamlardan olusabilir. */
const PARAM_ROUTES = {
  storeOrder: { param: "orderId", path: (id: string) => `/pages/store/orders/${id}`, fallback: "/pages/store/orders" },
  storeProduct: { param: "productId", path: (id: string) => `/pages/store/product/${id}`, fallback: "/pages/store" },
} as const;

export type NotificationScreen = keyof typeof SCREEN_ROUTES | keyof typeof PARAM_ROUTES;

const ID_PATTERN = /^[1-9]\d{0,17}$/;

const has = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

export function resolveNotificationRoute(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const screen = record.screen;
  if (typeof screen !== "string") return null;
  if (has(SCREEN_ROUTES, screen)) return SCREEN_ROUTES[screen as keyof typeof SCREEN_ROUTES];
  if (has(PARAM_ROUTES, screen)) {
    const route = PARAM_ROUTES[screen as keyof typeof PARAM_ROUTES];
    const raw = record[route.param];
    const id = typeof raw === "number" ? String(raw) : raw;
    return typeof id === "string" && ID_PATTERN.test(id) ? route.path(id) : route.fallback;
  }
  return null;
}

/** Push verisindeki bolum ("app"); bilinmiyorsa MB FIT. Eski bildirimlerde "type" alanindan turetilir. */
export function notificationAppOf(data: unknown): NotificationApp {
  if (!data || typeof data !== "object") return "mbfit";
  const { app, type } = data as Record<string, unknown>;
  if (app === "mbshop" || app === "mbfit") return app;
  return type === "StoreOrderUpdate" || type === "StorePromotion" ? "mbshop" : "mbfit";
}

/** Hedefi olmayan bir bildirime dokunulunca acilacak gelen kutusu: MB Shop bildirimleri MB Shop'unkinde. */
export function inboxRouteFor(app: NotificationApp): string {
  return app === "mbshop" ? SCREEN_ROUTES.storeNotifications : SCREEN_ROUTES.notifications;
}

/** Push verisindeki bildirim kimligi (gelen kutusundaki kayit); gecersizse null. */
export function parseNotificationId(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const raw = (data as Record<string, unknown>).notificationId;
  const id = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
