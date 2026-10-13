import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { useAuth } from "../../../shared/auth/AuthContext";
import { AuthScreenLayout } from "../../../shared/auth/components/AuthScreenLayout";
import { AuthStatusIcon } from "../../../shared/auth/components/AuthStatusIcon";
import { EmailCodeVerification, InitialCodeState } from "../../../shared/auth/components/EmailCodeVerification";
import { goToDashboardAfterAuth } from "../../../shared/auth/navigation";
import { useEmailVerificationState } from "../../../shared/auth/useEmailVerificationState";
import { OnboardingButton } from "../onboarding/components/OnboardingButton";
import { SuccessScreen } from "../onboarding/components/SuccessScreen";

const CODE_STATES: InitialCodeState[] = ["sent", "failed", "notSent"];

/**
 * E-posta Doğrulama: e-postaya gelen 6 haneli kod girilir. Doğrulama zorunludur; e-posta doğrulanmadan
 * uygulamaya geçilemez (bkz. EmailVerificationGate). Kullanıcı yalnızca çıkış yapabilir.
 * - code=sent: kayıt yanıtında kod az önce gönderildi (geri sayım başlar).
 * - code=failed: kayıtta kod gönderilemedi; "Kodu tekrar gönder" hemen kullanılabilir.
 * - code=notSent (varsayılan): ekran açılınca yeni kod istenir (girişle gelen doğrulanmamış hesap).
 */
export default function VerifyEmailRoute() {
  const router = useRouter();
  const { logout } = useAuth();
  const params = useLocalSearchParams<{ code?: string; from?: string; name?: string }>();
  const initialState = CODE_STATES.includes(params.code as InitialCodeState) ? (params.code as InitialCodeState) : "notSent";
  const fromRegistration = params.from === "register";
  const { isSignedIn, email, emailConfirmed, markEmailConfirmed } = useEmailVerificationState();
  const [justVerified, setJustVerified] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const continueToApp = () => goToDashboardAfterAuth(router);
  const goToLogin = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace("/pages/login");
  };
  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } finally {
      setIsSigningOut(false);
      if (router.canDismiss()) router.dismissAll();
      router.replace("/pages/welcome");
    }
  };

  if (!isSignedIn) {
    return (
      <AuthScreenLayout
        icon={<AuthStatusIcon name="mail-unread-outline" />}
        title="E-postanı doğrula"
        subtitle="Doğrulama kodunu almak için giriş yap."
        onBack={goToLogin}
        footer={<OnboardingButton label="Giriş yap" onPress={goToLogin} />}
      />
    );
  }

  if (justVerified && fromRegistration) {
    return <SuccessScreen name={typeof params.name === "string" ? params.name : ""} onStart={continueToApp} />;
  }

  if (justVerified || emailConfirmed === true) {
    return (
      <AuthScreenLayout
        showBack={false}
        icon={<AuthStatusIcon name="checkmark-circle-outline" />}
        title="E-posta adresin doğrulandı"
        subtitle={email ?? undefined}
        footer={<OnboardingButton label="Uygulamaya devam et" onPress={continueToApp} />}
      />
    );
  }

  return (
    <AuthScreenLayout
      showBack={false}
      icon={<AuthStatusIcon name="mail-unread-outline" />}
      title="E-postanı doğrula"
      subtitle="Devam etmek için e-postana gelen 6 haneli kodu gir."
      footer={<OnboardingButton variant="text" label="Çıkış yap" onPress={signOut} isLoading={isSigningOut} />}
    >
      <EmailCodeVerification
        email={email}
        initialState={initialState}
        onVerified={() => {
          markEmailConfirmed();
          setJustVerified(true);
        }}
      />
    </AuthScreenLayout>
  );
}
