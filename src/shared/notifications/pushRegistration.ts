import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { deactivatePushDevice, registerPushDevice } from "../../services/api/notifications";
import { DeviceDeactivationReason } from "../../services/api/types";

// Cihazdaki kalici anahtarlar. Push token'i yalnizca bu cihazda, cikista backend'e "bu token'i
// pasiflestir" diyebilmek icin saklanir; hicbir ekranda gosterilmez veya loglanmaz.
const INSTALLATION_ID_KEY = "merfit.installationId";
const PUSH_TOKEN_KEY = "merfit.pushToken";
// Yalnizca Android'de kullanilir (bkz. shouldPromptForPermission). iOS'ta Keychain uygulama silinse de
// korundugu icin bu isaret orada guvenilir degildir.
const ANDROID_PERMISSION_ASKED_KEY = "merfit.pushPermissionAsked";

export const ANDROID_CHANNEL_ID = "default";
/** MB Shop bildirimlerinin ayri Android kanali (backend Notifications:Expo:ShopAndroidChannelId ile ayni). */
export const ANDROID_SHOP_CHANNEL_ID = "mbshop";

const isWeb = Platform.OS === "web";

/**
 * EAS proje kimligi app config'ten okunur (eas init / eas build bunu extra.eas.projectId'ye yazar);
 * koda gomulmez. Yoksa push kaydi sessizce atlanir, uygulama calismaya devam eder.
 */
export function getEasProjectId(): string | null {
  const fromConfig = Constants.expoConfig?.extra?.eas?.projectId;
  const projectId = typeof fromConfig === "string" ? fromConfig : Constants.easConfig?.projectId;
  return projectId && projectId.trim() ? projectId.trim() : null;
}

/**
 * Uzak push yalnizca gercek cihazda calisir; web, simulator/emulator ve Android'de Expo Go
 * (SDK 53+ uzak push desteklemez) icin kayit denenmez.
 */
export function isPushSupported(): boolean {
  if (isWeb || !Device.isDevice) return false;
  if (Platform.OS === "android" && Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return false;
  return getEasProjectId() !== null;
}

async function readItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeItem(key: string, value: string | null): Promise<void> {
  try {
    if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  } catch {}
}

function generateInstallationId(): string {
  const random = () => Math.random().toString(16).slice(2, 10).padEnd(8, "0");
  return `${Date.now().toString(16)}-${random()}-${random()}-${random()}`;
}

/** Uygulama kurulumu basina kalici kimlik; backend ayni kurulumun eski token'larini bununla pasiflestirir. */
async function getInstallationId(): Promise<string> {
  const existing = await readItem(INSTALLATION_ID_KEY);
  if (existing) return existing;
  const created = generateInstallationId();
  await writeItem(INSTALLATION_ID_KEY, created);
  return created;
}

export function getDeviceTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Genel",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  // Kullanici telefon ayarlarindan MB Shop bildirimlerini MB FIT'ten bagimsiz olarak kapatabilir.
  await Notifications.setNotificationChannelAsync(ANDROID_SHOP_CHANNEL_ID, {
    name: "MB Shop",
    description: "Sipariş durumu ve MB Shop kampanyaları",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export type PushPermissionState = "granted" | "denied" | "undetermined" | "unsupported";

export async function getPushPermissionState(): Promise<PushPermissionState> {
  if (isWeb || !Device.isDevice) return "unsupported";
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status as PushPermissionState;
  } catch {
    return "unsupported";
  }
}

/**
 * Izin ister (yalnizca sistem hala sorabiliyorsa). Reddedilmesi hata degildir; uygulama push olmadan
 * calismaya devam eder ve uygulama ici gelen kutusu kullanilir.
 */
export async function requestPushPermission(): Promise<PushPermissionState> {
  if (isWeb || !Device.isDevice) return "unsupported";
  try {
    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted || !current.canAskAgain) return current.status as PushPermissionState;
    if (Platform.OS === "android") await writeItem(ANDROID_PERMISSION_ASKED_KEY, "1");
    const result = await Notifications.requestPermissionsAsync();
    return result.status as PushPermissionState;
  } catch {
    return "unsupported";
  }
}

/** Oturumdaki kullaniciya bu cihazin token'ini pasiflestirtir (cikis / izin geri alindi). Hatalar yutulur. */
export async function deactivateStoredPushToken(reason: DeviceDeactivationReason, timeoutMs = 4000): Promise<void> {
  const token = await readItem(PUSH_TOKEN_KEY);
  if (!token) return;
  try {
    await Promise.race([
      deactivatePushDevice(token, reason),
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  } catch {
    // Backend'e ulasilamazsa: bir sonraki giriste ayni token yeni kullaniciya tasinir (backend unique token).
  } finally {
    await writeItem(PUSH_TOKEN_KEY, null);
  }
}

/**
 * Oturum acilinca izin penceresi gosterilmeli mi?
 * - iOS: sistem durumu "undetermined" ise bu kurulumda hic sorulmamistir. (Keychain'deki bir isaret
 *   uygulama silinip kurulunca kaldigi icin kullanilmaz; yoksa yeniden kurulumda izin hic sorulmuyordu.)
 * - Android 13+: bildirimler henuz acik olmadigi icin expo-notifications hic sorulmamis izni de
 *   "denied" dondurur; "undetermined" beklenemez. Burada canAskAgain + bu kurulumda daha once
 *   sorduk mu (SecureStore; yeniden kurulumda Keystore anahtari tasinmadigi icin okunamaz) esas alinir; reddeden kullaniciya
 *   her oturumda tekrar sorulmaz.
 */
async function shouldPromptForPermission(permission: Notifications.NotificationPermissionsStatus): Promise<boolean> {
  if (permission.granted || !permission.canAskAgain) return false;
  if (Platform.OS === "ios") return permission.status === "undetermined";
  return !(await readItem(ANDROID_PERMISSION_ASKED_KEY));
}

let syncInFlight: Promise<void> | null = null;

/**
 * Izin durumunu backend kaydiyla esitler:
 * - izin verildiyse Expo push token'i alinip PUT /api/notifications/devices ile kaydedilir
 *   (token degistiyse veya hesap degistiyse backend satiri gunceller);
 * - izin geri alindiysa daha once kaydedilen token "PermissionRevoked" ile pasiflestirilir;
 * - promptIfNeeded true ise ve izin bu kurulumda hic sorulmadiysa izin istenir (bkz. shouldPromptForPermission).
 * Ayni anda tek senkronizasyon calisir; tum hatalar yutulur (push opsiyoneldir).
 */
export function syncPushRegistration(options: { promptIfNeeded: boolean }): Promise<void> {
  if (syncInFlight) return syncInFlight;
  syncInFlight = doSync(options).finally(() => {
    syncInFlight = null;
  });
  return syncInFlight;
}

async function doSync({ promptIfNeeded }: { promptIfNeeded: boolean }): Promise<void> {
  if (!isPushSupported()) return;
  try {
    await ensureAndroidChannel();
    let permission = await Notifications.getPermissionsAsync();

    if (promptIfNeeded && (await shouldPromptForPermission(permission))) {
      if (Platform.OS === "android") await writeItem(ANDROID_PERMISSION_ASKED_KEY, "1");
      permission = await Notifications.requestPermissionsAsync();
    }

    if (!permission.granted) {
      await deactivateStoredPushToken("PermissionRevoked");
      return;
    }

    const projectId = getEasProjectId();
    if (!projectId) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    await registerPushDevice({
      token,
      platform: Platform.OS === "ios" ? "ios" : "android",
      installationId: await getInstallationId(),
      // Kisisel cihaz adi yerine yalnizca model adi gonderilir (orn. "iPhone 15").
      deviceName: Device.modelName ?? null,
      appVersion: Constants.expoConfig?.version ?? null,
      osVersion: Device.osVersion ?? null,
      timeZone: getDeviceTimeZone(),
    });
    await writeItem(PUSH_TOKEN_KEY, token);
  } catch (error) {
    if (__DEV__) console.warn("[Push] Kayıt yapılamadı:", (error as Error)?.message);
  }
}
