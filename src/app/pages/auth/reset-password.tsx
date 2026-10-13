import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { isApiError } from "../../../services/api/client";
import { resetPassword, validatePasswordResetToken } from "../../../services/api/auth";
import { useAuth } from "../../../shared/auth/AuthContext";
import { AuthScreenLayout } from "../../../shared/auth/components/AuthScreenLayout";
import { AuthStatusIcon } from "../../../shared/auth/components/AuthStatusIcon";
import { toUserMessage } from "../../../shared/auth/errors";
import { getPasswordRules, isNewPasswordValid, PASSWORD_MAX_LENGTH } from "../../../shared/auth/passwordRules";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { OnboardingInput } from "../onboarding/components/OnboardingInput";

type Phase = "checking" | "form" | "success" | "invalid" | "unreachable";

const INVALID_LINK_MESSAGE = "Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Yeni bir bağlantı isteyebilirsin.";

/**
 * Yeni Şifre Belirleme. E-postadaki bağlantı (mbfitnativeapp://pages/auth/reset-password?token=...)
 * bu ekranı açar. Jeton yalnızca bellekte tutulur, loglanmaz; önce geçerliliği kontrol edilir, böylece
 * süresi dolmuş bağlantıda kullanıcı form doldurmadan açık bir hata görür.
 */
export default function ResetPasswordRoute() {
  const router = useRouter();
  const { colors } = useTheme();
  const { status, logout } = useAuth();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === "string" ? params.token : "";

  const [phase, setPhase] = useState<Phase>(token ? "checking" : "invalid");
  const [invalidMessage, setInvalidMessage] = useState(INVALID_LINK_MESSAGE);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const checkedTokenRef = useRef<string | null>(null);

  const check = useCallback(async () => {
    if (!token) return;
    setPhase("checking");
    try {
      await validatePasswordResetToken(token);
      setPhase("form");
    } catch (error) {
      if (isApiError(error) && error.status === 400) {
        setInvalidMessage(error.message || INVALID_LINK_MESSAGE);
        setPhase("invalid");
      } else {
        setErrorMessage(toUserMessage(error, "Bağlantı kontrol edilemedi. Lütfen tekrar dene."));
        setPhase("unreachable");
      }
    }
  }, [token]);

  useEffect(() => {
    if (!token || checkedTokenRef.current === token) return;
    checkedTokenRef.current = token;
    check();
  }, [token, check]);

  const rules = getPasswordRules(password, confirmPassword);
  const canSubmit = isNewPasswordValid(password, confirmPassword) && !isSubmitting;

  const submit = async () => {
    if (!canSubmit) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await resetPassword({ token, newPassword: password, confirmPassword });
      setPassword("");
      setConfirmPassword("");
      // Sunucu tum oturumlari kapatti; bu cihazdaki oturum da kapatilir, kullanici yeni sifresiyle girer.
      if (status === "signedIn") {
        await logout();
      }
      setPhase("success");
    } catch (error) {
      // Sifre kurallari istemcide zaten saglandigi icin 400, baglantinin gecersiz/suresi dolmus/kullanilmis oldugunu gosterir.
      if (isApiError(error) && error.status === 400) {
        setInvalidMessage(error.message || INVALID_LINK_MESSAGE);
        setPhase("invalid");
      } else {
        setErrorMessage(toUserMessage(error, "Şifren güncellenemedi. Lütfen tekrar dene."));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToLogin = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace("/pages/login");
  };

  if (phase === "checking") {
    return (
      <AuthScreenLayout title="Bağlantı kontrol ediliyor" subtitle="Bir saniye…">
        <ActivityIndicator color={colors.primary} accessibilityLabel="Yükleniyor" />
      </AuthScreenLayout>
    );
  }

  if (phase === "success") {
    return (
      <AuthScreenLayout
        showBack={false}
        icon={<AuthStatusIcon name="checkmark-circle-outline" />}
        title="Şifren güncellendi"
        subtitle="Güvenliğin için tüm cihazlardaki oturumların kapatıldı. Yeni şifrenle giriş yapabilirsin."
        footer={<OnboardingButton label="Giriş yap" onPress={goToLogin} />}
      />
    );
  }

  if (phase === "invalid" || phase === "unreachable") {
    const unreachable = phase === "unreachable";
    return (
      <AuthScreenLayout
        icon={<AuthStatusIcon name="alert-circle-outline" tone="danger" />}
        title={unreachable ? "Bağlantı kontrol edilemedi" : "Bağlantı kullanılamıyor"}
        subtitle={unreachable ? errorMessage ?? undefined : invalidMessage}
        onBack={goToLogin}
        footer={
          unreachable ? (
            <>
              <OnboardingButton label="Tekrar dene" onPress={check} />
              <OnboardingButton variant="text" label="Girişe dön" onPress={goToLogin} />
            </>
          ) : (
            <>
              <OnboardingButton label="Yeni bağlantı iste" onPress={() => router.replace("/pages/auth/forgot-password")} />
              <OnboardingButton variant="text" label="Girişe dön" onPress={goToLogin} />
            </>
          )
        }
      />
    );
  }

  return (
    <AuthScreenLayout
      title="Yeni şifre belirle"
      subtitle="Hesabın için yeni bir şifre seç. Başka hesaplarında kullanmadığın bir şifre olsun."
      onBack={goToLogin}
      footer={<OnboardingButton label="Şifremi güncelle" onPress={submit} disabled={!canSubmit} isLoading={isSubmitting} />}
    >
      <OnboardingInput
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          setErrorMessage(null);
        }}
        placeholder="Yeni şifre"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        maxLength={PASSWORD_MAX_LENGTH}
        accessibilityLabel="Yeni şifre"
        style={styles.fieldFont}
      />
      <View style={styles.gap} />
      <OnboardingInput
        value={confirmPassword}
        onChangeText={(value) => {
          setConfirmPassword(value);
          setErrorMessage(null);
        }}
        placeholder="Yeni şifre (tekrar)"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        maxLength={PASSWORD_MAX_LENGTH}
        returnKeyType="done"
        onSubmitEditing={submit}
        accessibilityLabel="Yeni şifre tekrar"
        style={styles.fieldFont}
      />

      <Pressable
        onPress={() => setShowPassword((value) => !value)}
        accessibilityRole="switch"
        accessibilityState={{ checked: showPassword }}
        hitSlop={8}
        style={styles.toggleRow}
      >
        <Text style={[styles.toggleLabel, { color: colors.primary }]}>{showPassword ? "Şifreyi gizle" : "Şifreyi göster"}</Text>
      </Pressable>

      <View style={styles.rules} accessibilityRole="summary">
        {rules.map((rule) => (
          <View key={rule.key} style={styles.ruleRow} accessible accessibilityLabel={`${rule.label}: ${rule.met ? "tamam" : "eksik"}`}>
            <Ionicons
              name={rule.met ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={rule.met ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.ruleLabel, { color: rule.met ? colors.text : colors.textSecondary }]}>{rule.label}</Text>
          </View>
        ))}
      </View>

      {errorMessage ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.danger }]}>
          {errorMessage}
        </Text>
      ) : null}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  fieldFont: { fontSize: 16, fontWeight: "600" },
  gap: { height: 12 },
  toggleRow: { alignSelf: "flex-end", marginTop: 14 },
  toggleLabel: { fontSize: 12, fontWeight: "600" },
  rules: { marginTop: 16, gap: 8 },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ruleLabel: { fontSize: 13 },
  error: { fontSize: 13, fontWeight: "600", marginTop: 16 },
});
