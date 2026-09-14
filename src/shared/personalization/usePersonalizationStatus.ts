import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

import { getPersonalizationStatus } from "../../services/api/personalization";
import { PersonalizationStatus } from "../../services/api/types";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // ~2 dakika (3sn * 40) - sonrasinda kullaniciyi sonsuza kadar bekletmeyiz.

type UsePersonalizationStatusResult = {
  status: PersonalizationStatus | null;
  isPending: boolean;
  isFailed: boolean;
  /** Poll siniri asildiysa (backend hala Pending/Processing donuyor olsa bile) true olur. */
  isTimedOut: boolean;
  /**
   * Yalnizca isFailed=true iken dolu olabilir. Backend'deki gercek basarisizlik sebebini
   * (orn. ekipman uyusmazligi ile katalogda hic aktif antrenman olmamasi ayni sey degildir -
   * bkz. WorkoutPlanGenerator.cs) tasir; ekranda genel bir mesajin yerine/yaninda kullanilabilir.
   */
  errorMessage: string | null;
  /** Kullanicinin manuel "tekrar dene" butonuna basmasi icin. */
  refetch: () => void;
};

/**
 * PersonalizationJob durumunu, kontrollu araliklarla (polling) sorgular:
 * - Yalnizca durum Pending/Processing oldugu surece 3 saniyede bir sorgular.
 * - Completed/Failed'e ulasilinca (veya deneme siniri asilinca) polling'i DURDURUR.
 * - Ekran unmount oldugunda interval/timeout temizlenir.
 * - Uygulama arka plana gecince (AppState "background"/"inactive") polling DURAKLAR;
 *   on plana donunce kaldigi yerden devam eder (gereksiz istek atilmaz).
 */
export function usePersonalizationStatus(enabled: boolean): UsePersonalizationStatusResult {
  const [status, setStatus] = useState<PersonalizationStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [refetchTick, setRefetchTick] = useState(0);

  const attemptCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAppActiveRef = useRef(true);
  const isMountedRef = useRef(true);

  const clearScheduledPoll = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    isMountedRef.current = true;
    attemptCountRef.current = 0;
    setIsTimedOut(false);

    const poll = async () => {
      if (!isMountedRef.current) return;

      // Uygulama arka plandaysa istek atmadan, biraz sonra tekrar dene (background'da gereksiz
      // polling yapma gereksinimi).
      if (!isAppActiveRef.current) {
        timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        return;
      }

      attemptCountRef.current += 1;

      try {
        const response = await getPersonalizationStatus();
        if (!isMountedRef.current) return;

        setStatus(response.status);
        setErrorMessage(response.errorMessage ?? null);

        const stillWaiting = response.status === "Pending" || response.status === "Processing";
        if (!stillWaiting) {
          return; // Completed veya Failed - polling'i durdur.
        }

        if (attemptCountRef.current >= MAX_POLL_ATTEMPTS) {
          setIsTimedOut(true);
          return;
        }

        timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        // Ag hatasi - sessizce birakip bir sonraki turda tekrar dene (deneme sayisi yine de artar).
        if (isMountedRef.current && attemptCountRef.current < MAX_POLL_ATTEMPTS) {
          timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        } else if (isMountedRef.current) {
          setIsTimedOut(true);
        }
      }
    };

    poll();

    return () => {
      isMountedRef.current = false;
      clearScheduledPoll();
    };
  }, [enabled, refetchTick, clearScheduledPoll]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      isAppActiveRef.current = nextState === "active";
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const refetch = useCallback(() => {
    clearScheduledPoll();
    setIsTimedOut(false);
    setErrorMessage(null);
    setRefetchTick((tick) => tick + 1);
  }, [clearScheduledPoll]);

  return {
    status,
    errorMessage,
    isPending: status === "Pending" || status === "Processing",
    isFailed: status === "Failed",
    isTimedOut,
    refetch,
  };
}
