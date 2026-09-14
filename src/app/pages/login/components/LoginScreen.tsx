import { useRouter } from "expo-router";
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
import { useTheme } from "../../../../shared/theme/ThemeContext";
import { OnboardingButton } from "../../onboarding/components/OnboardingButton";
import { OnboardingInput } from "../../onboarding/components/OnboardingInput";

export function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Backend hem e-posta hem kullanici adi ile girisi destekler (bkz.
  // AuthService.FindUserByEmailOrUsernameAsync); bu yuzden burada e-posta formati zorunlu
  // tutulmaz, yalnizca alanin dolu olmasi yeterlidir.
  const identifierValid = emailOrUsername.trim().length > 0;
  const passwordValid = password.length >= 6;
  const canSubmit = identifierValid && passwordValid && !isSubmitting;

  const handleLogin = async () => {
    if (!canSubmit) return;

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await login({ emailOrUsername: emailOrUsername.trim(), password });
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
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={[styles.backButton, { backgroundColor: colors.inputBackground }]}
          >
            <Text style={[styles.backLabel, { color: colors.text }]}>←</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.text }]}>Tekrar hoş geldin.</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            MB FIT yolculuğuna devam etmek için giriş yap.
          </Text>

          <View style={styles.form}>
            <OnboardingInput
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
              placeholder="E-posta veya kullanıcı adı"
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
              <Text style={[styles.forgotLabel, { color: colors.primary }]}>Şifreni mi unuttun?</Text>
            </Pressable>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerLabel, { color: colors.textSecondary }]}>veya</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <Pressable
              onPress={handleGoogleLogin}
              style={[styles.googleButton, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
            >
              <Text style={[styles.googleLabel, { color: colors.text }]}>Google ile devam et</Text>
            </Pressable>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {isSubmitting ? (
            <View style={[styles.loadingButton, { backgroundColor: colors.primaryPressed }]}>
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
            <Text style={[styles.signupText, { color: colors.textSecondary }]}>
              Hesabın yok mu?{" "}
              <Text style={[styles.signupLink, { color: colors.primary }]}>Kayıt ol</Text>
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingButton: {
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
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
  },
  backLabel: { fontSize: 17, fontWeight: "600" },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 36 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  form: { marginTop: 32 },
  fieldFont: { fontSize: 16, fontWeight: "600" },
  gap: { height: 12 },
  forgotRow: { alignSelf: "flex-end", marginTop: 14 },
  forgotLabel: { fontSize: 12, fontWeight: "600" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerLabel: { fontSize: 12, marginHorizontal: 12 },
  googleButton: {
    height: 56,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  googleLabel: { fontSize: 14, fontWeight: "600" },
  footer: { paddingHorizontal: 24, paddingBottom: 8, paddingTop: 8 },
  signupRow: { marginTop: 16, alignItems: "center" },
  signupText: { fontSize: 13 },
  signupLink: { fontWeight: "700" },
});
