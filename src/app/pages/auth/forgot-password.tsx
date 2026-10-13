import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { isApiError } from "../../../services/api/client";
import { requestPasswordReset, resetPassword, verifyPasswordResetCode } from "../../../services/api/auth";
import { useAuth } from "../../../shared/auth/AuthContext";
import { AuthScreenLayout } from "../../../shared/auth/components/AuthScreenLayout";
import { AuthStatusIcon } from "../../../shared/auth/components/AuthStatusIcon";
import { CODE_LENGTH, CodeInput } from "../../../shared/auth/components/CodeInput";
import { retryAfterSeconds, toUserMessage } from "../../../shared/auth/errors";
import { getPasswordRules, isNewPasswordValid, PASSWORD_MAX_LENGTH } from "../../../shared/auth/passwordRules";
import { formatCooldown, useResendCooldown } from "../../../shared/auth/useResendCooldown";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { OnboardingInput } from "../onboarding/components/OnboardingInput";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "email" | "code" | "password" | "success";

/**
 * Şifremi Unuttum, üç adımda:
 * 1. E-posta: sunucu hesap olsun olmasın aynı genel mesajı döner (hesabın varlığı açığa çıkmaz).
 * 2. Kod: e-postaya gelen 6 haneli kod kontrol edilir (kod başına sınırlı deneme hakkı vardır).
 * 3. Yeni şifre: e-posta + kod ile kaydedilir; sunucu tüm oturumları kapatır.
 * Kod yalnızca bellekte tutulur, loglanmaz.
 */
export default function ForgotPasswordRoute() {
  const router = useRouter();
  const { colors } = useTheme();
  const { status, logout } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(typeof params.email === "string" && EMAIL_REGEX.test(params.email) ? params.email : "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cooldown = useResendCooldown();

  const trimmedEmail = email.trim();
  const emailValid = EMAIL_REGEX.test(trimmedEmail);

  const goToLogin = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace("/pages/login");
  };

  const sendCode = async () => {
    if (!emailValid || isSubmitting || cooldown.isCoolingDown) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(trimmedEmail);
      setInfoMessage(result.message);
      setCode("");
      cooldown.start();
      setStep("code");
    } catch (error) {
      const wait = retryAfterSeconds(error);
      if (wait) cooldown.start(wait);
      setErrorMessage(toUserMessage(error, "Kod gönderilemedi. Lütfen tekrar dene."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkCode = async () => {
    if (code.length !== CODE_LENGTH || isSubmitting) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await verifyPasswordResetCode(trimmedEmail, code);
      setStep("password");
    } catch (error) {
      setCode("");
      setErrorMessage(toUserMessage(error, "Kod doğrulanamadı. Lütfen tekrar dene."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSavePassword = isNewPasswordValid(password, confirmPassword) && !isSubmitting;

  const savePassword = async () => {
    if (!canSavePassword) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await resetPassword({ email: trimmedEmail, code, newPassword: password, confirmPassword });
      setPassword("");
      setConfirmPassword("");
      setCode("");
      // Sunucu tum oturumlari kapatti; bu cihazdaki oturum da kapatilir, kullanici yeni sifresiyle girer.
      if (status === "signedIn") {
        await logout();
      }
      setStep("success");
    } catch (error) {
      if (isApiError(error) && error.status === 400) {
        // Sifre kurallari istemcide saglandigi icin 400, kodun bu arada gecersiz oldugunu gosterir
        // (suresi doldu / kullanildi / deneme siniri): kod adimina donulur.
        setCode("");
        setStep("code");
      }
      setErrorMessage(toUserMessage(error, "Şifren güncellenemedi. Lütfen tekrar dene."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorText = errorMessage ? (
    <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.danger }]}>
      {errorMessage}
    </Text>
  ) : null;

  if (step === "success") {
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

  if (step === "password") {
    const rules = getPasswordRules(password, confirmPassword);
    return (
      <AuthScreenLayout
        title="Yeni şifre belirle"
        subtitle="Hesabın için yeni bir şifre seç. Başka hesaplarında kullanmadığın bir şifre olsun."
        onBack={() => {
          setErrorMessage(null);
          setStep("code");
        }}
        footer={<OnboardingButton label="Şifremi güncelle" onPress={savePassword} disabled={!canSavePassword} isLoading={isSubmitting} />}
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
          onSubmitEditing={savePassword}
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
        {errorText}
      </AuthScreenLayout>
    );
  }

  if (step === "code") {
    return (
      <AuthScreenLayout
        title="Kodu gir"
        subtitle={infoMessage ?? undefined}
        onBack={() => {
          setErrorMessage(null);
          setStep("email");
        }}
        footer={
          <>
            <OnboardingButton label="Devam et" onPress={checkCode} disabled={code.length !== CODE_LENGTH} isLoading={isSubmitting} />
            <OnboardingButton
              variant="text"
              label={cooldown.isCoolingDown ? `Kodu tekrar gönder (${formatCooldown(cooldown.secondsLeft)})` : "Kodu tekrar gönder"}
              onPress={sendCode}
              disabled={cooldown.isCoolingDown || isSubmitting}
            />
          </>
        }
      >
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          <Text style={[styles.strong, { color: colors.text }]}>{trimmedEmail}</Text> adresine gelen 6 haneli kodu gir. Kod 15
          dakika geçerlidir.
        </Text>
        <CodeInput
          value={code}
          onChangeText={(value) => {
            setCode(value);
            setErrorMessage(null);
          }}
          returnKeyType="done"
          onSubmitEditing={checkCode}
          autoFocus
          style={styles.codeInput}
        />
        {errorText}
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      title="Şifreni mi unuttun?"
      subtitle="Hesabına kayıtlı e-posta adresini yaz; şifreni sıfırlaman için 6 haneli bir kod gönderelim."
      footer={
        <OnboardingButton
          label={cooldown.isCoolingDown ? `Tekrar dene (${formatCooldown(cooldown.secondsLeft)})` : "Kod gönder"}
          onPress={sendCode}
          disabled={!emailValid || cooldown.isCoolingDown}
          isLoading={isSubmitting}
        />
      }
    >
      <OnboardingInput
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setErrorMessage(null);
        }}
        placeholder="E-posta"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={sendCode}
        accessibilityLabel="E-posta adresi"
        style={styles.fieldFont}
      />
      {errorText}
      <View style={styles.spacer} />
      <Text style={[styles.note, { color: colors.textSecondary }]}>
        Güvenliğin için bu adresle bir hesap olup olmadığını göstermiyoruz. Kayıtlıysa birkaç dakika içinde kodu alırsın.
      </Text>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  fieldFont: { fontSize: 16, fontWeight: "600" },
  codeInput: { marginTop: 20 },
  gap: { height: 12 },
  error: { fontSize: 13, fontWeight: "600", marginTop: 12 },
  note: { fontSize: 13, lineHeight: 19 },
  strong: { fontWeight: "700" },
  spacer: { height: 16 },
  toggleRow: { alignSelf: "flex-end", marginTop: 14 },
  toggleLabel: { fontSize: 12, fontWeight: "600" },
  rules: { marginTop: 16, gap: 8 },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ruleLabel: { fontSize: 13 },
});
