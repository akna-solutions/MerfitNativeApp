import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError, NetworkError } from "../../../services/api/client";
import { finishMiniGameSession, startMiniGameSession } from "../../../services/api/miniGames";
import type { FinishMiniGameRequest, MiniGameResult, MiniGameSession } from "../../../services/api/types";
import { ENGINE_VERSION } from "./engine";
import type { GameOverResult } from "./DumbbellDashGame";

export type RoundSession =
  | { kind: "preparing" }
  | {
      kind: "ready";
      seed: number;
      /** Sunucu oturumu; null ise bu tur puansiz (cevrimdisi / odul kapali / limit). */
      session: MiniGameSession | null;
      /** Turun neden puansiz oldugu (varsa). */
      notice: string | null;
    };

export type RoundFinish =
  | { kind: "idle" }
  | { kind: "submitting"; result: GameOverResult }
  | { kind: "done"; result: GameOverResult; reward: MiniGameResult | null }
  | { kind: "failed"; result: GameOverResult; message: string };

/** Oturum acma isteginin bekleme suresi; asilirsa oyun puansiz baslar (oyun aga bagimli degildir). */
export const START_TIMEOUT_MS = 6000;
/** Sonuc gonderiminde gecici hatalar icin yeniden deneme gecikmeleri (ayni istek; sunucu idempotent). */
export const FINISH_RETRY_DELAYS_MS = [1000, 2500];

function randomSeed(): number {
  return Math.floor(Math.random() * 0x100000000);
}

function isTransient(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  return error instanceof ApiError && (error.status >= 500 || error.status === 408);
}

function startFailureNotice(error: unknown): string {
  if (error instanceof ApiError && error.status !== 401 && error.status < 500 && error.message) {
    // Gunluk oyun siniri (429), eski uygulama surumu (400) gibi sunucunun acikladigi durumlar.
    return `${error.message} Bu tur puan kazandırmaz.`;
  }
  return "Sunucuya bağlanılamadı; bu tur puan kazandırmaz.";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mini oyunun sunucu tarafi: her tur icin oturum (seed) acar ve oyun bitince sonucu dogrulatip odulu alir.
 * Iki giris noktasi (dinlenme ekrani, MB FIT Puanim) bu hook'u DumbbellDashPanel uzerinden ortak kullanir.
 *
 * - Oyun backend'e bagimli degildir: oturum acilamazsa tur rastgele seed'le puansiz oynanir.
 * - Sonuc gonderimi gecici hatalarda AYNI istekle yeniden denenir; sunucu ayni oturumu ikinci kez
 *   odullendirmedigi icin cift puan olusmaz. Panel kapatilsa bile gonderim tamamlanir.
 * - Yeni tur, onceki sonucun gonderimi bitmeden acilmaz (yeni oturum bitmemis eskisini gecersiz kilar).
 */
export function useMiniGameRewards(onRewardGranted?: (result: MiniGameResult) => void) {
  const [session, setSession] = useState<RoundSession>({ kind: "preparing" });
  const [finish, setFinish] = useState<RoundFinish>({ kind: "idle" });

  const mountedRef = useRef(true);
  const sessionRef = useRef<RoundSession>(session);
  const prepareTokenRef = useRef(0);
  const startAbortRef = useRef<AbortController | null>(null);
  const pendingSubmitRef = useRef<Promise<void> | null>(null);
  const onRewardGrantedRef = useRef(onRewardGranted);
  useEffect(() => {
    onRewardGrantedRef.current = onRewardGranted;
  }, [onRewardGranted]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      startAbortRef.current?.abort();
    };
  }, []);

  const updateSession = useCallback((next: RoundSession) => {
    sessionRef.current = next;
    if (mountedRef.current) setSession(next);
  }, []);

  const prepareRound = useCallback(async () => {
    const token = ++prepareTokenRef.current;
    const isStale = () => !mountedRef.current || token !== prepareTokenRef.current;
    updateSession({ kind: "preparing" });
    setFinish({ kind: "idle" });

    if (pendingSubmitRef.current) await pendingSubmitRef.current;
    if (isStale()) return;

    startAbortRef.current?.abort();
    const controller = new AbortController();
    startAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), START_TIMEOUT_MS);
    try {
      const started = await startMiniGameSession(ENGINE_VERSION, controller.signal);
      if (isStale()) return;
      if (started.rewardsEnabled && started.sessionId !== null && started.seed !== null) {
        updateSession({ kind: "ready", seed: started.seed, session: started, notice: null });
      } else {
        updateSession({ kind: "ready", seed: randomSeed(), session: null, notice: "Mini oyun ödülleri şu anda kapalı; bu tur puan kazandırmaz." });
      }
    } catch (error) {
      if (isStale()) return;
      updateSession({ kind: "ready", seed: randomSeed(), session: null, notice: startFailureNotice(error) });
    } finally {
      clearTimeout(timeoutId);
      if (startAbortRef.current === controller) startAbortRef.current = null;
    }
  }, [updateSession]);

  const submit = useCallback((result: GameOverResult) => {
    const current = sessionRef.current;
    const sessionId = current.kind === "ready" ? current.session?.sessionId ?? null : null;
    if (sessionId === null) {
      setFinish({ kind: "done", result, reward: null });
      return;
    }

    setFinish({ kind: "submitting", result });
    const request: FinishMiniGameRequest = { score: result.score, ticks: result.ticks, flapTicks: result.flapTicks };

    const send = async (): Promise<MiniGameResult> => {
      for (let attempt = 0; ; attempt += 1) {
        try {
          return await finishMiniGameSession(sessionId, request);
        } catch (error) {
          if (!isTransient(error) || attempt >= FINISH_RETRY_DELAYS_MS.length) throw error;
          await delay(FINISH_RETRY_DELAYS_MS[attempt]);
        }
      }
    };

    const promise = send()
      .then((reward) => {
        if (reward.awardedPoints > 0) onRewardGrantedRef.current?.(reward);
        if (mountedRef.current) setFinish({ kind: "done", result, reward });
      })
      .catch((error: unknown) => {
        if (!mountedRef.current) return;
        const message =
          error instanceof ApiError && error.status < 500 && error.message
            ? error.message
            : "Sonuç sunucuya iletilemedi. Bağlantını kontrol edip tekrar dene.";
        setFinish({ kind: "failed", result, message });
      })
      .finally(() => {
        if (pendingSubmitRef.current === promise) pendingSubmitRef.current = null;
      });
    pendingSubmitRef.current = promise;
  }, []);

  return { session, finish, prepareRound, submit };
}
