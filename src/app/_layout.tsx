import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "../shared/auth/AuthContext";
import { BrandSplash } from "../shared/brand/BrandSplash";
import { useReducedMotion } from "../shared/motion/useReducedMotion";
import { EmailVerificationGate } from "../shared/auth/EmailVerificationGate";
import { StoreProvider } from "../features/store/state/StoreContext";
import { PushNotificationsProvider } from "../shared/notifications/PushNotificationsProvider";
import { PlusProvider } from "../shared/plus/PlusContext";
import { ProfileProvider } from "../shared/profile/ProfileContext";
import { StepCounterProvider } from "../shared/steps/StepCounterContext";
import { ThemeProvider, useTheme } from "../shared/theme/ThemeContext";

// Native acilis ekrani, ayni gorunumle baslayan JS acilis ekrani (BrandSplash) cizilene kadar acik kalir.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Web'de veya ekran zaten kapanmissa yok sayilir.
});

function RootNavigation() {
  const { isDark, colors } = useTheme();
  const { status } = useAuth();
  const reducedMotion = useReducedMotion();
  const [splashVisible, setSplashVisible] = useState(true);
  const handleSplashFinish = useCallback(() => setSplashVisible(false), []);
  return (
    <>
      <StatusBar style={splashVisible || isDark ? "light" : "dark"} />
      <EmailVerificationGate />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          // Android'de varsayilan gecis platforma gore degisip sert gorunebiliyor; iOS benzeri yumusak kayma
          // kullanilir. "Hareketi azalt" acikken yalnizca kisa bir solma yapilir.
          animation: reducedMotion ? "fade" : Platform.OS === "android" ? "ios_from_right" : "default",
          animationDuration: reducedMotion ? 150 : 320,
        }}
      >
        {/* Acilis ekranindan karsilama ekranina sert kayma yerine yumusak bir solma ile gecilir. */}
        <Stack.Screen name="index" options={{ animation: "fade" }} />
        <Stack.Screen name="pages/welcome/index" options={{ animation: "fade", animationDuration: reducedMotion ? 150 : 400 }} />
      </Stack>
      {splashVisible ? <BrandSplash ready={status !== "loading"} onFinish={handleSplashFinish} /> : null}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <ThemeProvider>
            <PlusProvider>
              <PushNotificationsProvider>
                <StoreProvider>
                  <StepCounterProvider>
                    <RootNavigation />
                  </StepCounterProvider>
                </StoreProvider>
              </PushNotificationsProvider>
            </PlusProvider>
          </ThemeProvider>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
