import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { resendVerificationEmail } from "../../../services/api/auth";
import { useTheme } from "../../theme/ThemeContext";
import { retryAfterSeconds, toUserMessage } from "../errors";
import { formatCooldown, useResendCooldown } from "../useResendCooldown";

type Props = {
  email: string | null;
  /**
   * Kayit yanitindaki VerificationEmailSent: false ise ilk e-posta gonderilemedi; kart bunu soyler
   * ve beklemeden tekrar gondermeyi sunar. undefined/true: e-posta gonderildi kabul edilir.
   */
  initialSendFailed?: boolean;
  /** Ilk e-posta az once gonderildiyse geri sayim onunla baslar (sn). */
  initialCooldownSeconds?: number;
  /** Sunucu e-postanin zaten dogrulandigini bildirirse cagrilir. */
  onAlreadyVerified?: () => void;
};

/**
 * "E-postani dogrula" karti: dogrulama baglantisinin gonderildigi adresi gosterir ve bekleme
 * suresiyle birlikte "Tekrar gönder" sunar. Kayit sonrasi basari ekraninda ve dogrulama ekraninda kullanilir.
 */
export function EmailVerificationNotice({ email, initialSendFailed = false, initialCooldownSeconds = 0, onAlreadyVerified }: Props) {
  const { colors } = useTheme();
  const cooldown = useResendCooldown(initialSendFailed ? 0 : initialCooldownSeconds);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ kind: "info" | "error"; text: string } | null>(
    initialSendFailed
      ? { kind: "error", text: "Doğrulama e-postası gönderilemedi. Aşağıdan tekrar deneyebilirsin." }
      : null,
  );

  const handleResend = async () => {
    if (isSending || cooldown.isCoolingDown) return;
    setIsSending(true);
    setStatus(null);
    try {
      const result = await resendVerificationEmail();
      if (result.alreadyVerified) {
        setStatus({ kind: "info", text: "E-posta adresin zaten doğrulanmış." });
        onAlreadyVerified?.();
        return;
      }
      cooldown.start(result.resendAvailableInSeconds);
      setStatus({ kind: "info", text: "Yeni doğrulama bağlantısını gönderdik. Gelen kutunu ve spam klasörünü kontrol et." });
    } catch (error) {
      const wait = retryAfterSeconds(error);
      if (wait) cooldown.start(wait);
      setStatus({ kind: "error", text: toUserMessage(error, "E-posta gönderilemedi. Lütfen tekrar dene.") });
    } finally {
      setIsSending(false);
    }
  };

  const disabled = isSending || cooldown.isCoolingDown;
  const buttonLabel = cooldown.isCoolingDown
    ? `Tekrar gönder (${formatCooldown(cooldown.secondsLeft)})`
    : "Doğrulama e-postasını tekrar gönder";

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>E-postanı doğrula</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        {email ? (
          <>
            Doğrulama bağlantısını <Text style={[styles.email, { color: colors.text }]}>{email}</Text> adresine gönderdik.
          </>
        ) : (
          "Doğrulama bağlantısını kayıtlı e-posta adresine gönderdik."
        )}{" "}
        Gelen kutunu (ve spam klasörünü) kontrol et, bağlantıya dokun.
      </Text>

      {status ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.status, { color: status.kind === "error" ? colors.danger : colors.textSecondary }]}
        >
          {status.text}
        </Text>
      ) : null}

      <Pressable
        onPress={handleResend}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        accessibilityState={{ disabled, busy: isSending }}
        hitSlop={8}
        style={[styles.button, { borderColor: disabled ? colors.border : colors.primary }]}
      >
        {isSending ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={[styles.buttonLabel, { color: disabled ? colors.textSecondary : colors.primary }]}>{buttonLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  title: { fontSize: 15, fontWeight: "700" },
  body: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  email: { fontWeight: "700" },
  status: { fontSize: 13, lineHeight: 18, fontWeight: "600", marginTop: 12 },
  button: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  buttonLabel: { fontSize: 14, fontWeight: "700" },
});
