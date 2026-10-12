import { apiRequest } from "./client";
import {
  DeviceDeactivationReason,
  NotificationCategory,
  NotificationItem,
  NotificationPreferences,
  NotificationTypeSetting,
  PagedResult,
  RegisterDeviceRequest,
  UpdateNotificationPreferencesRequest,
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

/** POST /api/notifications/{id}/read - yalnizca oturumdaki kullanicinin bildirimi etkilenir. */
export async function markNotificationRead(id: number): Promise<void> {
  return apiRequest<void>(`/api/notifications/${id}/read`, { method: "POST" });
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

/** GET /api/notifications/preferences */
export async function getNotificationPreferences(signal?: AbortSignal): Promise<NotificationPreferences> {
  return apiRequest<NotificationPreferences>("/api/notifications/preferences", { signal });
}

/** PUT /api/notifications/preferences */
export async function updateNotificationPreferences(
  request: UpdateNotificationPreferencesRequest,
): Promise<NotificationPreferences> {
  return apiRequest<NotificationPreferences>("/api/notifications/preferences", {
    method: "PUT",
    body: request,
  });
}

/** PUT /api/notifications/devices - Expo push token'ini oturumdaki kullaniciya kaydeder/yeniler. */
export async function registerPushDevice(request: RegisterDeviceRequest): Promise<void> {
  await apiRequest<unknown>("/api/notifications/devices", { method: "PUT", body: request });
}

/** POST /api/notifications/devices/deactivate - cikista veya izin geri alindiginda token'i pasiflestirir. */
export async function deactivatePushDevice(token: string, reason: DeviceDeactivationReason): Promise<void> {
  return apiRequest<void>("/api/notifications/devices/deactivate", {
    method: "POST",
    body: { token, reason },
  });
}
