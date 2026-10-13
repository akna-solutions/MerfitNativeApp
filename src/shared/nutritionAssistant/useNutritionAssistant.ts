import { useCallback, useEffect, useReducer, useRef } from "react";

import { ApiError, NetworkError } from "../../services/api/client";
import { deleteAssistantConversation, getAssistantConversation, sendAssistantMessage } from "../../services/api/nutritionAssistant";
import { assistantReducer, AssistantDayState, initialDayState } from "./chatState";

/** API hatalarini sohbet icinde gosterilecek kisa ve anlasilir Turkce mesaja cevirir. */
export function assistantErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Oturumunun süresi doldu. Lütfen tekrar giriş yap.";
    if (error.status === 404) return "Bu sohbet bulunamadı. Pencereyi kapatıp yeniden açmayı dene.";
    if (error.status >= 500 && error.status !== 503) return "Beslenme asistanı şu an yanıt veremiyor. Lütfen tekrar dene.";
    return error.message;
  }
  if (error instanceof NetworkError) {
    return error.message.includes("zaman aşımı")
      ? "Yanıt beklenenden uzun sürdü. Lütfen tekrar dene."
      : "Bağlantı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.";
  }
  return "Bir sorun oluştu. Lütfen tekrar dene.";
}

let keySeed = 0;
const nextKey = () => `local-${Date.now()}-${keySeed++}`;

export type NutritionAssistantController = {
  state: AssistantDayState;
  /** Sohbeti sunucudan yukler/yeniler (pencere her acildiginda). */
  load: () => Promise<void>;
  /** Mesaj gonderir; bos mesajda veya baska bir yanit beklenirken false doner (cift gonderim olmaz). */
  send: (text: string) => Promise<boolean>;
  /** Basarisiz mesaji yeniden gonderir. */
  retry: (key: string) => Promise<boolean>;
  /** Gunun sohbetini sunucudan siler; yanit beklenirken calismaz. Hata olursa mesaj doner. */
  clear: () => Promise<string | null>;
};

/**
 * Beslenme asistani sohbetinin durum yonetimi. Durum gun bazinda tutulur ve ekran acik oldugu surece
 * korunur: pencere kapatilip acildiginda ayni gunun sohbeti aninda geri gelir, ardindan sunucudan
 * yenilenir (uygulama yeniden baslasa da sunucu ayni gunun sohbetini dondurur).
 */
export function useNutritionAssistant(date: string): NutritionAssistantController {
  const [all, dispatch] = useReducer(assistantReducer, {});
  const allRef = useRef(all);
  allRef.current = all;
  const inFlight = useRef(new Set<string>());
  const controllers = useRef(new Set<AbortController>());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const active = controllers.current;
    return () => {
      mounted.current = false;
      active.forEach((c) => c.abort());
    };
  }, []);

  const track = () => {
    const controller = new AbortController();
    controllers.current.add(controller);
    return controller;
  };

  const load = useCallback(async () => {
    const controller = track();
    dispatch({ type: "loadStart", date });
    try {
      const response = await getAssistantConversation(date, controller.signal);
      if (mounted.current) dispatch({ type: "loadSuccess", date, response });
    } catch (error) {
      if (mounted.current && !controller.signal.aborted) {
        dispatch({ type: "loadFailure", date, message: assistantErrorMessage(error) });
      }
    } finally {
      controllers.current.delete(controller);
    }
  }, [date]);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      // Ayni gun icin tek istek: hizli art arda dokunmalar yok sayilir.
      if (!message || inFlight.current.has(date)) return false;
      inFlight.current.add(date);

      const key = nextKey();
      const controller = track();
      dispatch({ type: "sendStart", date, key, text: message });
      try {
        const response = await sendAssistantMessage(
          { message, conversationId: allRef.current[date]?.conversationId ?? null, date },
          controller.signal,
        );
        if (mounted.current) dispatch({ type: "sendSuccess", date, key, response });
        return true;
      } catch (error) {
        if (mounted.current && !controller.signal.aborted) {
          dispatch({ type: "sendFailure", date, key, message: assistantErrorMessage(error) });
        }
        return false;
      } finally {
        controllers.current.delete(controller);
        inFlight.current.delete(date);
      }
    },
    [date],
  );

  const retry = useCallback(
    async (key: string) => {
      const item = allRef.current[date]?.items.find((i) => i.key === key && i.status === "failed");
      if (!item || inFlight.current.has(date)) return false;
      dispatch({ type: "removeItem", date, key });
      return send(item.content);
    },
    [date, send],
  );

  const clear = useCallback(async () => {
    if (inFlight.current.has(date)) return "Yanıt beklenirken sohbet silinemez.";
    const controller = track();
    try {
      await deleteAssistantConversation(date, controller.signal);
      if (mounted.current) dispatch({ type: "reset", date });
      return null;
    } catch (error) {
      return assistantErrorMessage(error);
    } finally {
      controllers.current.delete(controller);
    }
  }, [date]);

  return { state: all[date] ?? initialDayState, load, send, retry, clear };
}
