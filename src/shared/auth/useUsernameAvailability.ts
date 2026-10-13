import { useEffect, useState } from "react";

import { checkUsernameAvailability } from "../../services/api/auth";

/** Backend RegisterRequest.Username kuraliyla ayni: 3-30 karakter, harf/rakam/alt cizgi. */
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export type UsernameAvailability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "unavailable"; message: string }
  /** Kontrol yapilamadi (ag hatasi vb.); kayit sirasinda sunucu yine kontrol eder. */
  | { state: "unknown" };

const DEBOUNCE_MS = 400;

/**
 * Kayit ekraninda kullanici adinin anlik kontrolu: yazmayi biraktiktan kisa sure sonra
 * GET /api/auth/username-availability cagrilir; eski istekler iptal edilir.
 */
export function useUsernameAvailability(username: string): UsernameAvailability {
  const normalized = username.trim().toLowerCase();
  const [result, setResult] = useState<{ username: string; value: UsernameAvailability }>({
    username: "",
    value: { state: "idle" },
  });

  useEffect(() => {
    if (!USERNAME_REGEX.test(normalized)) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      checkUsernameAvailability(normalized, controller.signal)
        .then((response) => {
          setResult({
            username: normalized,
            value: response.available
              ? { state: "available" }
              : { state: "unavailable", message: response.message || "Bu kullanıcı adı kullanılamıyor." },
          });
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setResult({ username: normalized, value: { state: "unknown" } });
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [normalized]);

  // 3 karakterden kisa: henuz yaziliyor; uyari gosterilmez (devam butonu zaten kapali).
  if (normalized.length < 3) return { state: "idle" };
  if (!USERNAME_REGEX.test(normalized)) {
    return { state: "unavailable", message: "Kullanıcı adı 3-30 karakter olmalı; yalnızca harf, rakam ve _ içerebilir." };
  }
  return result.username === normalized ? result.value : { state: "checking" };
}
