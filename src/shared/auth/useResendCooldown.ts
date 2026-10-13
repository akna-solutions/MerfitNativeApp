import { useCallback, useEffect, useState } from "react";

/** Varsayilan tekrar gonderim bekleme suresi; backend AccountEmail:ResendCooldown ile ayni (60 sn). */
export const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;

/**
 * "Tekrar gönder" butonunun geri sayimi. Sunucu 429 + Retry-After donerse o sure, basarili
 * gonderimde yanittaki resendAvailableInSeconds kullanilir.
 */
export function useResendCooldown(initialSeconds = 0) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const start = useCallback((seconds: number = DEFAULT_RESEND_COOLDOWN_SECONDS) => {
    setSecondsLeft(Math.max(0, Math.ceil(seconds)));
  }, []);

  return { secondsLeft, isCoolingDown: secondsLeft > 0, start };
}

export function formatCooldown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}:${rest.toString().padStart(2, "0")}` : `${rest} sn`;
}
