import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { requestPasswordReset } from "../../../services/api/auth";
import { AuthScreenLayout } from "../../../shared/auth/components/AuthScreenLayout";
import { AuthStatusIcon } from "../../../shared/auth/components/AuthStatusIcon";
import { retryAfterSeconds, toUserMessage } from "../../../shared/auth/errors";
import { formatCooldown, useResendCooldown } from "../../../shared/auth/useResendCooldown";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { OnboardingInput } from "../onboarding/components/OnboardingInput";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Şifremi Unuttum. Sunucu, hesap olsun olmasın aynı genel mesajı döner; ekran da hesabın varlığını
 * açığa çıkarmayan bu mesajı gösterir. Tekrar gönderim, sunucudaki bekleme süresiyle aynı geri sayımla sınırlıdır.
 */
export default function ForgotPasswordRoute() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof params.email === "string" && EMAIL_REGEX.test(params.email) ? params.email : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cooldown = useResendCooldown();

  const emailValid = EMAIL_REGEX.test(email.trim());
  const canSubmit = emailValid && !isSubmitting && !cooldown.isCoolingDown;

  const submit = async () => {
    if (!canSubmit) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setSentMessage(result.message);
      cooldown.start();
    } catch (error) {
      const wait = retryAfterSeconds(error);
      if (wait) cooldown.start(wait);
      setErrorMessage(toUserMessage(error, "Bağlantı gönderilemedi. Lütfen tekrar dene."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToLogin = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/pages/login");
  };

  if (sentMessage) {
    return (
      <AuthScreenLayout
        icon={<AuthStatusIcon name="mail-unread-outline" />}
        title="E-postanı kontrol et"
        subtitle={sentMessage}
        footer={
          <>
            <OnboardingButton label="Girişe dön" onPress={goToLogin} />
            <OnboardingButton
              variant="text"
              label={cooldown.isCoolingDown ? `Tekrar gönder (${formatCooldown(cooldown.secondsLeft)})` : "Tekrar gönder"}
              onPress={submit}
              disabled={!canSubmit}
            />
          </>
        }
      >
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Bağlantı 30 dakika geçerlidir ve yalnızca bir kez kullanılabilir. E-posta gelmediyse spam klasörünü kontrol et
          veya adresi doğru yazdığından emin ol.
        </Text>
        {errorMessage ? (
          <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.danger }]}>
            {errorMessage}
          </Text>
        ) : null}
        <Pressable
          onPress={() => {
            setSentMessage(null);
            setErrorMessage(null);
          }}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.linkRow}
        >
          <Text style={[styles.link, { color: colors.primary }]}>Farklı bir e-posta adresi dene</Text>
        </Pressable>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      title="Şifreni mi unuttun?"
      subtitle="Hesabına kayıtlı e-posta adresini yaz; şifreni sıfırlaman için bir bağlantı gönderelim."
      footer={
        <OnboardingButton
          label={cooldown.isCoolingDown ? `Tekrar dene (${formatCooldown(cooldown.secondsLeft)})` : "Bağlantı gönder"}
          onPress={submit}
          disabled={!canSubmit}
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
        onSubmitEditing={submit}
        accessibilityLabel="E-posta adresi"
        style={styles.fieldFont}
      />
      {errorMessage ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.danger }]}>
          {errorMessage}
        </Text>
      ) : null}
      <View style={styles.spacer} />
      <Text style={[styles.note, { color: colors.textSecondary }]}>
        Güvenliğin için bu adresle bir hesap olup olmadığını göstermiyoruz. Kayıtlıysa birkaç dakika içinde e-posta alırsın.
      </Text>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  fieldFont: { fontSize: 16, fontWeight: "600" },
  error: { fontSize: 13, fontWeight: "600", marginTop: 12 },
  note: { fontSize: 13, lineHeight: 19 },
  spacer: { height: 16 },
  linkRow: { marginTop: 20, alignSelf: "flex-start" },
  link: { fontSize: 13, fontWeight: "700" },
});
