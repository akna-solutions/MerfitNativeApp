import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../shared/auth/AuthContext";
import { useReducedMotion } from "../shared/motion/useReducedMotion";
import { EmailVerificationGate } from "../shared/auth/EmailVerificationGate";
import { StoreProvider } from "../features/store/state/StoreContext";
import { PushNotificationsProvider } from "../shared/notifications/PushNotificationsProvider";
import { PlusProvider } from "../shared/plus/PlusContext";
import { ProfileProvider } from "../shared/profile/ProfileContext";
import { ThemeProvider, useTheme } from "../shared/theme/ThemeContext";

function RootNavigation() {
  const { isDark, colors } = useTheme();
  const reducedMotion = useReducedMotion();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
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
      />
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
                  <RootNavigation />
                </StoreProvider>
              </PushNotificationsProvider>
            </PlusProvider>
          </ThemeProvider>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
