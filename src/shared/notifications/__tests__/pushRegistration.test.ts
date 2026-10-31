// Kayit sonrasi push kaydi: izin bu kurulumda hic sorulmadiysa ("undetermined") Keychain'de eski bir
// kurulumdan kalan kayit olsa bile izin istenir ve token backend'e gonderilir.

const mockSecureStore = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStore.delete(key);
  }),
}));

jest.mock("expo-device", () => ({ isDevice: true, modelName: "iPhone 15", osVersion: "18.0" }));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0", extra: { eas: { projectId: "test-project" } } }, executionEnvironment: "standalone" },
  ExecutionEnvironment: { StoreClient: "storeClient", Standalone: "standalone", Bare: "bare" },
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: "ExponentPushToken[abc]" })),
  setNotificationChannelAsync: jest.fn(async () => null),
  AndroidImportance: { DEFAULT: 3 },
}));

jest.mock("../../../services/api/notifications", () => ({
  registerPushDevice: jest.fn(async () => undefined),
  deactivatePushDevice: jest.fn(async () => undefined),
}));

jest.mock("react-native", () => ({ Platform: { OS: "ios" } }));

import { Platform } from "react-native";

import * as Notifications from "expo-notifications";

import { deactivatePushDevice, registerPushDevice } from "../../../services/api/notifications";
import { syncPushRegistration } from "../pushRegistration";

const getPermissions = Notifications.getPermissionsAsync as jest.Mock;
const requestPermissions = Notifications.requestPermissionsAsync as jest.Mock;

const undetermined = { granted: false, canAskAgain: true, status: "undetermined" };
const granted = { granted: true, canAskAgain: true, status: "granted" };
const denied = { granted: false, canAskAgain: true, status: "denied" };

beforeEach(() => {
  (Platform as { OS: string }).OS = "ios";
  mockSecureStore.clear();
  jest.clearAllMocks();
});

test("iOS'ta yeniden kurulumdan kalan 'soruldu' isareti olsa da yeni kayitta izin istenir ve cihaz kaydedilir", async () => {
  // Eski surumun Keychain'e yazdigi isaret; uygulama silinip kurulunca da kalir.
  mockSecureStore.set("merfit.pushPermissionAsked", "1");
  getPermissions.mockResolvedValue(undetermined);
  requestPermissions.mockResolvedValue(granted);

  await syncPushRegistration({ promptIfNeeded: true });

  expect(requestPermissions).toHaveBeenCalledTimes(1);
  expect(registerPushDevice).toHaveBeenCalledWith(
    expect.objectContaining({ token: "ExponentPushToken[abc]", platform: "ios" }),
  );
});

test("izin zaten verilmisse sormadan kaydeder", async () => {
  getPermissions.mockResolvedValue(granted);

  await syncPushRegistration({ promptIfNeeded: true });

  expect(requestPermissions).not.toHaveBeenCalled();
  expect(registerPushDevice).toHaveBeenCalledTimes(1);
});

test("izin reddedilmisse tekrar sormaz ve kayitli token'i pasiflestirir", async () => {
  mockSecureStore.set("merfit.pushToken", "ExponentPushToken[old]");
  getPermissions.mockResolvedValue(denied);

  await syncPushRegistration({ promptIfNeeded: true });

  expect(requestPermissions).not.toHaveBeenCalled();
  expect(registerPushDevice).not.toHaveBeenCalled();
  expect(deactivatePushDevice).toHaveBeenCalledWith("ExponentPushToken[old]", "PermissionRevoked");
});

test("promptIfNeeded false iken (uygulama one gelince) izin istenmez", async () => {
  getPermissions.mockResolvedValue(undetermined);

  await syncPushRegistration({ promptIfNeeded: false });

  expect(requestPermissions).not.toHaveBeenCalled();
  expect(registerPushDevice).not.toHaveBeenCalled();
});

describe("Android 13+", () => {
  // Hic sorulmamis izin icin expo-notifications "denied" dondurur (bildirimler henuz kapali).
  const neverAsked = { granted: false, canAskAgain: true, status: "denied" };

  beforeEach(() => {
    (Platform as { OS: string }).OS = "android";
  });

  test("yeni kayitta (hic sorulmamis) izin istenir ve cihaz android olarak kaydedilir", async () => {
    getPermissions.mockResolvedValue(neverAsked);
    requestPermissions.mockResolvedValue(granted);

    await syncPushRegistration({ promptIfNeeded: true });

    expect(requestPermissions).toHaveBeenCalledTimes(1);
    expect(registerPushDevice).toHaveBeenCalledWith(expect.objectContaining({ platform: "android" }));
  });

  test("bu kurulumda bir kez sorulup reddedildiyse tekrar sorulmaz", async () => {
    getPermissions.mockResolvedValue(neverAsked);
    requestPermissions.mockResolvedValue(neverAsked);

    await syncPushRegistration({ promptIfNeeded: true });
    await syncPushRegistration({ promptIfNeeded: true });

    expect(requestPermissions).toHaveBeenCalledTimes(1);
    expect(registerPushDevice).not.toHaveBeenCalled();
  });
});
