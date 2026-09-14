import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { BackgroundVideo } from "./components/BackgroundVideo";
import { WelcomeContent } from "./components/WelcomeContent";
import { colors } from "./theme";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <BackgroundVideo />
      <WelcomeContent
        onGetStarted={() => router.push("/pages/onboarding")}
        onLogin={() => router.push("/pages/login")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
