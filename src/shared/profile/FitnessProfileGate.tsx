import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OnboardingButton } from "../../app/pages/onboarding/components/OnboardingButton";
import { useTheme } from "../theme/ThemeContext";
import { useProfile } from "./ProfileContext";

/** Onboarding'in yalnizca fitness adimlarini acar (bkz. OnboardingContainer, mode=fitness). */
export const COMPLETE_FITNESS_PROFILE_ROUTE = "/pages/onboarding?mode=fitness" as Href;

/**
 * MB Fit ekranlarinin (ana sayfa, antrenman, beslenme, ilerleme) kapisi. Yalnizca alisveris icin kayit olmus
 * kullanicinin fitness profili bostur; bu ekranlar yerine profili tamamlama cagrisi gosterilir. Profil
 * yuklenene kadar (veya tamamlanmissa) ekranin kendisi gosterilir; ekranlar kendi yukleniyor durumunu yonetir.
 */
export function FitnessProfileGate({ children }: { children: ReactNode }) {
  const { profile, isLoaded } = useProfile();

  if (isLoaded && profile.fitnessProfileCompleted === false) {
    return <CompleteFitnessProfilePrompt />;
  }

  return <>{children}</>;
}

function CompleteFitnessProfilePrompt() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]} testID="fitness-profile-gate">
      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: colors.cardActive, borderColor: colors.primary }]}>
          <Ionicons name="barbell" size={30} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          MB Fit'e hoş geldin
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Sana özel antrenman ve beslenme planı hazırlayabilmemiz için boyun, kilon ve hedefin gibi birkaç bilgiye
          ihtiyacımız var. Yaklaşık 2 dakika sürer.
        </Text>
      </View>
      <View style={styles.actions}>
        <OnboardingButton label="Profilimi tamamla" onPress={() => router.push(COMPLETE_FITNESS_PROFILE_ROUTE)} />
        <OnboardingButton variant="text" label="MB Shop'a dön" onPress={() => router.navigate("/pages/store" as Href)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center" },
  description: { fontSize: 15, lineHeight: 22, textAlign: "center" },
  // Alttaki navbar'in ustunde kalsin.
  actions: { gap: 8, paddingBottom: 120 },
});
