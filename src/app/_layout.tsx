import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../shared/auth/AuthContext";
import { PlusProvider } from "../shared/plus/PlusContext";
import { ProfileProvider } from "../shared/profile/ProfileContext";
import { ThemeProvider, useTheme } from "../shared/theme/ThemeContext";

function RootNavigation() {
  const { isDark, colors } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
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
              <RootNavigation />
            </PlusProvider>
          </ThemeProvider>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
