import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";

import { isApiError } from "../../../services/api/client";
import { confirmEmail } from "../../../services/api/auth";
import { AuthScreenLayout } from "../../../shared/auth/components/AuthScreenLayout";
import { AuthStatusIcon } from "../../../shared/auth/components/AuthStatusIcon";
import { EmailVerificationNotice } from "../../../shared/auth/components/EmailVerificationNotice";
import { toUserMessage } from "../../../shared/auth/errors";
import { goToDashboardAfterAuth } from "../../../shared/auth/navigation";
import { useEmailVerificationState } from "../../../shared/auth/useEmailVerificationState";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";

type Phase = "pending" | "verifying" | "success" | "failed";

/**
 * E-posta Doğrulama.
 * - Bağlantıyla açıldığında (mbfitnativeapp://pages/auth/verify-email?token=...) jetonu bir kez sunucuya
 *   gönderir ve sonucu gösterir. Jeton yalnızca bellekte tutulur, loglanmaz.
 * - Bağlantısız açıldığında (girişten sonra doğrulanmamış hesap) bekleyen durumu ve "Tekrar gönder"i gösterir.
 * Doğrulama zorunlu değildir: "Daha sonra" ile uygulamaya devam edilebilir (mevcut kullanıcıların girişi bozulmaz).
 */
export default function VerifyEmailRoute() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === "string" ? params.token : "";
  const { isSignedIn, email, emailConfirmed, markEmailConfirmed } = useEmailVerificationState();

  const [phase, setPhase] = useState<Phase>(token ? "verifying" : "pending");
  const [failure, setFailure] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const sentTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token || sentTokenRef.current === token) return;
    sentTokenRef.current = token;
    setPhase("verifying");
    confirmEmail(token)
      .then((result) => {
        setVerifiedEmail(result.email);
        // Baglanti baska bir hesaba aitse bu cihazdaki oturumun durumu degismez.
        if (!email || result.email.trim().toLowerCase() === email.trim().toLowerCase()) {
          markEmailConfirmed();
        }
        setPhase("success");
      })
      .catch((error) => {
        setFailure(
          isApiError(error) && error.status === 400
            ? error.message
            : toUserMessage(error, "E-posta doğrulanamadı. Lütfen tekrar dene."),
        );
        setPhase("failed");
      });
    // markEmailConfirmed/email yalnizca sonucu yorumlamak icin; jeton bir kez gonderilir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const continueToApp = () => goToDashboardAfterAuth(router);
  const goToLogin = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace("/pages/login");
  };

  if (phase === "verifying") {
    return (
      <AuthScreenLayout title="E-postan doğrulanıyor" subtitle="Bir saniye…" showBack={false}>
        <ActivityIndicator color={colors.primary} accessibilityLabel="Yükleniyor" />
      </AuthScreenLayout>
    );
  }

  if (phase === "success") {
    return (
      <AuthScreenLayout
        showBack={false}
        icon={<AuthStatusIcon name="checkmark-circle-outline" />}
        title="E-posta adresin doğrulandı"
        subtitle={verifiedEmail ? `${verifiedEmail} artık hesabına bağlı ve doğrulanmış.` : undefined}
        footer={
          isSignedIn ? (
            <OnboardingButton label="Uygulamaya devam et" onPress={continueToApp} />
          ) : (
            <OnboardingButton label="Giriş yap" onPress={goToLogin} />
          )
        }
      />
    );
  }

  if (phase === "failed") {
    return (
      <AuthScreenLayout
        icon={<AuthStatusIcon name="alert-circle-outline" tone="danger" />}
        title="E-posta doğrulanamadı"
        subtitle={failure ?? undefined}
        onBack={isSignedIn ? continueToApp : goToLogin}
        footer={
          isSignedIn ? (
            <OnboardingButton label="Uygulamaya devam et" onPress={continueToApp} />
          ) : (
            <OnboardingButton label="Giriş yap" onPress={goToLogin} />
          )
        }
      >
        {isSignedIn && emailConfirmed !== true ? (
          <EmailVerificationNotice email={email} />
        ) : !isSignedIn ? (
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            Yeni bir doğrulama bağlantısı istemek için giriş yap; uygulama sana yeniden gönderme seçeneği sunar.
          </Text>
        ) : null}
      </AuthScreenLayout>
    );
  }

  // Baglantisiz acilis: bekleyen dogrulama.
  if (!isSignedIn) {
    return (
      <AuthScreenLayout
        icon={<AuthStatusIcon name="mail-unread-outline" />}
        title="E-postanı doğrula"
        subtitle="Doğrulama e-postasını yeniden istemek için giriş yap."
        onBack={goToLogin}
        footer={<OnboardingButton label="Giriş yap" onPress={goToLogin} />}
      />
    );
  }

  if (emailConfirmed === true) {
    return (
      <AuthScreenLayout
        icon={<AuthStatusIcon name="checkmark-circle-outline" />}
        title="E-posta adresin doğrulanmış"
        subtitle={email ?? undefined}
        onBack={continueToApp}
        footer={<OnboardingButton label="Uygulamaya devam et" onPress={continueToApp} />}
      />
    );
  }

  return (
    <AuthScreenLayout
      icon={<AuthStatusIcon name="mail-unread-outline" />}
      title="E-postanı doğrula"
      subtitle="Hesabını güvende tutmak ve şifreni gerektiğinde sıfırlayabilmek için e-posta adresini doğrula."
      onBack={continueToApp}
      footer={<OnboardingButton label="Daha sonra" variant="secondary" onPress={continueToApp} />}
    >
      <EmailVerificationNotice email={email} onAlreadyVerified={markEmailConfirmed} />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 13, lineHeight: 19 },
});
