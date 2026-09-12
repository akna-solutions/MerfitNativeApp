import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../../../shared/auth/AuthContext";
import { ApiError, isApiError, NetworkError } from "../../../../services/api/client";
import { OnboardingButton } from "../../onboarding/components/OnboardingButton";
import { OnboardingInput } from "../../onboarding/components/OnboardingInput";
import { colors } from ".././theme";

export function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 6;
  const canSubmit = emailValid && passwordValid && !isSubmitting;

  const handleLogin = async () => {
    if (!canSubmit) return;

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await login({ emailOrUsername: email.trim(), password });
      router.replace("/pages/dashboard");
    } catch (error) {
      console.error("Login hatası:", error);
      if (isApiError(error)) {
        setErrorMessage(error.message);
      } else if (error instanceof NetworkError) {
        setErrorMessage("Sunucuya ulaşılamadı. İnternet bağlantınızı veya backend adresini kontrol edin.");
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Giriş yapılamadı. Lütfen tekrar deneyin.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Google OAuth akışı mevcut authentication sistemine bağlandığında burada tetiklenecek.
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <StatusBar style="light" />

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backButton}
          >
            <Text style={styles.backLabel}>←</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Tekrar hoş geldin.</Text>
          <Text style={styles.subtitle}>
            MB FIT yolculuğuna devam etmek için giriş yap.
          </Text>

          <View style={styles.form}>
            <OnboardingInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-posta"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.fieldFont}
            />
            <View style={styles.gap} />
            <OnboardingInput
              value={password}
              onChangeText={setPassword}
              placeholder="Şifre"
              secureTextEntry
              autoCapitalize="none"
              style={styles.fieldFont}
            />

            <Pressable hitSlop={8} style={styles.forgotRow}>
              <Text style={styles.forgotLabel}>Şifreni mi unuttun?</Text>
            </Pressable>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable onPress={handleGoogleLogin} style={styles.googleButton}>
              <Text style={styles.googleLabel}>Google ile devam et</Text>
            </Pressable>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {isSubmitting ? (
            <View style={styles.loadingButton}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : (
            <OnboardingButton
              label="Giriş yap"
              onPress={handleLogin}
              disabled={!canSubmit}
            />
          )}
          <Pressable
            onPress={() => router.push("/pages/onboarding")}
            hitSlop={8}
            style={styles.signupRow}
          >
            <Text style={styles.signupText}>
              Hesabın yok mu?{" "}
              <Text style={styles.signupLink}>Kayıt ol</Text>
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingButton: {
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.buttonElectricBlue,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
  },
  flex: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 4 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  backLabel: { color: colors.textPrimary, fontSize: 17, fontWeight: "600" },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 36 },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  form: { marginTop: 32 },
  fieldFont: { fontSize: 16, fontWeight: "600" },
  gap: { height: 12 },
  forgotRow: { alignSelf: "flex-end", marginTop: 14 },
  forgotLabel: { color: colors.electricBlue, fontSize: 12, fontWeight: "600" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerLabel: { color: colors.textMuted, fontSize: 12, marginHorizontal: 12 },
  googleButton: {
    height: 56,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  googleLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: "600" },
  footer: { paddingHorizontal: 24, paddingBottom: 8, paddingTop: 8 },
  signupRow: { marginTop: 16, alignItems: "center" },
  signupText: { color: colors.textMuted, fontSize: 13 },
  signupLink: { color: colors.electricBlue, fontWeight: "700" },
});
