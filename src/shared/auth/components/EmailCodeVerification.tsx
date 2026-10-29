import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DumbbellSpinner } from "../../motion/DumbbellSpinner";

import { isApiError } from "../../../services/api/client";
import { confirmEmail, resendVerificationEmail } from "../../../services/api/auth";
import { OnboardingButton } from "../../../app/pages/onboarding/components/OnboardingButton";
import { useTheme } from "../../theme/ThemeContext";
import { retryAfterSeconds, toUserMessage } from "../errors";
import { DEFAULT_RESEND_COOLDOWN_SECONDS, formatCooldown, useResendCooldown } from "../useResendCooldown";
import { CODE_LENGTH, CodeInput } from "./CodeInput";

/**
 * Ilk kodun durumu: "sent" az once gonderildi (kayit yaniti), "failed" gonderilemedi, "notSent" bu
 * oturumda henuz istenmedi (girisle gelen dogrulanmamis hesap); "notSent" ise ekran acilinca kod istenir.
 */
export type InitialCodeState = "sent" | "failed" | "notSent";

type Props = {
  email: string | null;
  initialState: InitialCodeState;
  /** Kod dogru girildiginde veya sunucu e-postanin zaten dogrulandigini bildirdiginde. */
  onVerified: () => void;
};

/**
 * E-posta dogrulama kodu: 6 haneli kod girisi, "Doğrula" ve bekleme suresiyle "Kodu tekrar gönder".
 * Kod yalnizca bellekte tutulur, loglanmaz.
 */
export function EmailCodeVerification({ email, initialState, onVerified }: Props) {
  const { colors } = useTheme();
  const cooldown = useResendCooldown(initialState === "sent" ? DEFAULT_RESEND_COOLDOWN_SECONDS : 0);
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState<{ kind: "info" | "error"; text: string } | null>(
    initialState === "failed"
      ? { kind: "error", text: "Doğrulama kodu gönderilemedi. Aşağıdan tekrar deneyebilirsin." }
      : null,
  );
  const autoSentRef = useRef(false);

  const send = async () => {
    if (isSending || cooldown.isCoolingDown) return;
    setIsSending(true);
    setStatus(null);
    try {
      const result = await resendVerificationEmail();
      if (result.alreadyVerified) {
        onVerified();
        return;
      }
      cooldown.start(result.resendAvailableInSeconds || DEFAULT_RESEND_COOLDOWN_SECONDS);
      setCode("");
      setStatus({ kind: "info", text: "Yeni kodu gönderdik. Gelen kutunu ve spam klasörünü kontrol et." });
    } catch (error) {
      const wait = retryAfterSeconds(error);
      if (wait) {
        // Az once bir kod gonderildi; o kod hala gecerli.
        cooldown.start(wait);
        setStatus({ kind: "info", text: "Kodu kısa süre önce gönderdik. Gelen kutunu kontrol et." });
      } else {
        setStatus({ kind: "error", text: toUserMessage(error, "Kod gönderilemedi. Lütfen tekrar dene.") });
      }
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (initialState !== "notSent" || autoSentRef.current) return;
    autoSentRef.current = true;
    send();
    // Kod ekran acildiginda yalnizca bir kez istenir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialState]);

  const verify = async () => {
    if (code.length !== CODE_LENGTH || isVerifying) return;
    setIsVerifying(true);
    setStatus(null);
    try {
      await confirmEmail(code);
      onVerified();
    } catch (error) {
      setCode("");
      setStatus({
        kind: "error",
        text: isApiError(error) && error.status === 400
          ? error.message || "Kod hatalı."
          : toUserMessage(error, "Kod doğrulanamadı. Lütfen tekrar dene."),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const resendDisabled = isSending || cooldown.isCoolingDown;
  const resendLabel = cooldown.isCoolingDown
    ? `Kodu tekrar gönder (${formatCooldown(cooldown.secondsLeft)})`
    : "Kodu tekrar gönder";

  return (
    <View>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        {email ? (
          <>
            6 haneli kodu <Text style={[styles.email, { color: colors.text }]}>{email}</Text> adresine gönderdik.
          </>
        ) : (
          "6 haneli kodu kayıtlı e-posta adresine gönderdik."
        )}{" "}
        Kod 15 dakika geçerlidir.
      </Text>

      <CodeInput
        value={code}
        onChangeText={(value) => {
          setCode(value);
          if (status?.kind === "error") setStatus(null);
        }}
        returnKeyType="done"
        onSubmitEditing={verify}
        editable={!isVerifying}
        autoFocus
        style={styles.input}
      />

      {status ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.status, { color: status.kind === "error" ? colors.danger : colors.textSecondary }]}
        >
          {status.text}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <OnboardingButton
          label="Doğrula"
          onPress={verify}
          disabled={code.length !== CODE_LENGTH}
          isLoading={isVerifying}
        />
      </View>

      <Pressable
        onPress={send}
        disabled={resendDisabled}
        accessibilityRole="button"
        accessibilityLabel={resendLabel}
        accessibilityState={{ disabled: resendDisabled, busy: isSending }}
        hitSlop={8}
        style={styles.resend}
      >
        {isSending ? (
          <DumbbellSpinner color={colors.primary} />
        ) : (
          <Text style={[styles.resendLabel, { color: resendDisabled ? colors.textSecondary : colors.primary }]}>
            {resendLabel}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 14, lineHeight: 20 },
  email: { fontWeight: "700" },
  input: { marginTop: 20 },
  status: { fontSize: 13, lineHeight: 18, fontWeight: "600", marginTop: 12 },
  actions: { marginTop: 20 },
  resend: { marginTop: 18, alignSelf: "center", minHeight: 24, justifyContent: "center" },
  resendLabel: { fontSize: 14, fontWeight: "700" },
});
