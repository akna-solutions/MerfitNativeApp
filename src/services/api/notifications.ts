import { apiRequest } from "./client";
import {
  NotificationCategory,
  NotificationItem,
  NotificationTypeSetting,
  PagedResult,
} from "./types";

/** GET /api/notifications - en yeniden eskiye, sayfali. category verilirse yalnizca o kategori. */
export async function getNotifications(
  options: { category?: NotificationCategory; page?: number; pageSize?: number } = {},
  signal?: AbortSignal,
): Promise<PagedResult<NotificationItem>> {
  const { category, page = 1, pageSize = 30 } = options;
  return apiRequest<PagedResult<NotificationItem>>("/api/notifications", {
    query: { page, pageSize, ...(category ? { category } : {}) },
    signal,
  });
}

/** GET /api/notifications/unread-count */
export async function getUnreadNotificationCount(
  category?: NotificationCategory,
  signal?: AbortSignal,
): Promise<number> {
  const result = await apiRequest<{ count: number }>("/api/notifications/unread-count", {
    query: category ? { category } : undefined,
    signal,
  });
  return result.count;
}

/** POST /api/notifications/read-all - kategori verilirse yalnizca o kategoriyi okundu yapar. */
export async function markAllNotificationsRead(category?: NotificationCategory): Promise<void> {
  return apiRequest<void>("/api/notifications/read-all", {
    method: "POST",
    query: category ? { category } : undefined,
  });
}

/** GET /api/notifications/settings */
export async function getNotificationSettings(signal?: AbortSignal): Promise<NotificationTypeSetting[]> {
  return apiRequest<NotificationTypeSetting[]>("/api/notifications/settings", { signal });
}

/** PUT /api/notifications/settings - yalnizca gonderilen turler guncellenir. */
export async function updateNotificationSettings(
  settings: { type: string; isEnabled: boolean }[],
): Promise<NotificationTypeSetting[]> {
  return apiRequest<NotificationTypeSetting[]>("/api/notifications/settings", {
    method: "PUT",
    body: { settings },
  });
}
