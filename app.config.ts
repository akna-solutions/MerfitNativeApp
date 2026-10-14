import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * app.json'u temel alir; yalnizca ortam degiskenine bagli ayarlari ekler.
 *
 * Google ile giris (iOS): Google Sign-In yerel modulu, iOS istemci kimliginin ters cevrilmis hali olan URL
 * scheme'ine ihtiyac duyar (com.googleusercontent.apps.<kimlik>). EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID tanimli
 * degilse eklenti eklenmez; uygulama yine derlenir ama iOS'ta "Google ile devam et" kullanilamaz.
 * Android icin eklentiye gerek yoktur (istemci kimligi paket adi + SHA-1 ile Google Cloud'da eslesir).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const plugins = [...(config.plugins ?? [])];

  if (iosClientId) {
    const id = iosClientId.replace(/\.apps\.googleusercontent\.com$/, "");
    plugins.push(["@react-native-google-signin/google-signin", { iosUrlScheme: `com.googleusercontent.apps.${id}` }]);
  }

  return { ...config, plugins } as ExpoConfig;
};
