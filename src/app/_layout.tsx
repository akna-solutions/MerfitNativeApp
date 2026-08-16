import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { PlusProvider } from "../shared/plus/PlusContext";
import { ProfileProvider } from "../shared/profile/ProfileContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <PlusProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </PlusProvider>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
