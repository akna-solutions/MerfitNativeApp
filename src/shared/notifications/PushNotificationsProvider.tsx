import * as Notifications from "expo-notifications";
import { useRootNavigationState, useRouter } from "expo-router";
import { ReactNode, useCallback, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

import { markNotificationRead } from "../../services/api/notifications";
import { useAuth } from "../auth/AuthContext";
import { parseNotificationId, resolveNotificationRoute } from "./navigation";
import { isPushSupported, syncPushRegistration } from "./pushRegistration";

// Uygulama acikken gelen bildirimler de banner olarak gosterilir; rozet sayisi uygulama ici
// okunmamis sayacindan yonetildigi icin push ile degistirilmez.
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Push yasam dongusu:
 * - giris yapilinca (ve her yeni oturumda) izin bir kez istenir, token backend'e kaydedilir;
 * - token degisince veya uygulama one gelince kayit yenilenir / izin geri alindiysa pasiflestirilir;
 * - bildirime dokunulunca yalnizca izinli ekranlara gidilir ve ilgili gelen kutusu kaydi okundu yapilir.
 * Cikista token pasiflestirme AuthContext.logout icinde yapilir.
 */
export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const { status, sessionVersion } = useAuth();
  const router = useRouter();
  const navigationReady = Boolean(useRootNavigationState()?.key);
  const signedIn = status === "signedIn";
  const pendingResponse = useRef<Notifications.NotificationResponse | null>(null);
  const handledIds = useRef(new Set<string>());

  // Oturum acildiginda (hesap degisimi dahil) kaydi esitle; izin daha once sorulmadiysa burada sorulur.
  useEffect(() => {
    if (!signedIn || !isPushSupported()) return;
    void syncPushRegistration({ promptIfNeeded: true });
  }, [signedIn, sessionVersion]);

  // Token yenilenmesi ve ayarlardan izin degisikligi.
  useEffect(() => {
    if (!signedIn || !isPushSupported()) return;
    const tokenSub = Notifications.addPushTokenListener(() => {
      void syncPushRegistration({ promptIfNeeded: false });
    });
    const appStateSub = AppState.addEventListener("change", (next) => {
      if (next === "active") void syncPushRegistration({ promptIfNeeded: false });
    });
    return () => {
      tokenSub.remove();
      appStateSub.remove();
    };
  }, [signedIn]);

  const openFromResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const requestId = response.notification.request.identifier;
      if (handledIds.current.has(requestId)) return;
      handledIds.current.add(requestId);

      const data = response.notification.request.content.data;
      const notificationId = parseNotificationId(data);
      if (notificationId !== null) {
        markNotificationRead(notificationId).catch(() => {});
      }
      const route = resolveNotificationRoute(data);
      router.push((route ?? "/pages/notifications") as never);
      try {
        Notifications.clearLastNotificationResponse();
      } catch {}
    },
    [router],
  );

  // Dokunma olaylari: oturum yoksa veya navigasyon hazir degilse beklet, hazir olunca isle.
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      pendingResponse.current = response;
      if (signedIn && navigationReady) {
        pendingResponse.current = null;
        openFromResponse(response);
      }
    });
    return () => sub.remove();
  }, [signedIn, navigationReady, openFromResponse]);

  // Uygulama bir bildirime dokunularak (kapaliyken) acildiysa.
  useEffect(() => {
    if (Platform.OS === "web" || !signedIn || !navigationReady) return;
    if (pendingResponse.current) {
      const response = pendingResponse.current;
      pendingResponse.current = null;
      openFromResponse(response);
      return;
    }
    const last = Notifications.getLastNotificationResponse();
    if (last && last.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      openFromResponse(last);
    }
  }, [signedIn, navigationReady, sessionVersion, openFromResponse]);

  return <>{children}</>;
}
