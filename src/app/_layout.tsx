import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { PlusProvider } from "../shared/plus/PlusContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PlusProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </PlusProvider>
    </SafeAreaProvider>
  );
}
