import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveDefaultBaseUrl(): string {
  // 1. Expo Go / dev client: Metro'nun bağlandığı host IP'sini (örn. 192.168.1.4) otomatik alır
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:5219`;
    }
  }

  // 2. Android emülatörde host makineye 10.0.2.2 ile erişilir
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5219";
  }

  // 3. Web / iOS Simulator
  return "http://localhost:5219";
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") ??
  resolveDefaultBaseUrl();

export const API_TIMEOUT_MS = 15000;
