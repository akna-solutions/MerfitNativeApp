import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "../../services/api/client";
import { getWeightReminder, logWeight, snoozeWeightReminder } from "../../services/api/progress";
import { WeightReminderResponse, WeightReminderSnoozeAction } from "../../services/api/types";
import { useProfile } from "../profile/ProfileContext";
import { UnitSystem, parseWeightToKg } from "./units";

/** Ana sayfa acildiktan sonra hatirlaticinin sorulmasindan once beklenen sure (ekran yerlessin). */
export const WEIGHT_REMINDER_DELAY_MS = 1500;

/**
 * Oturum bayragi: hatirlatici bir uygulama oturumunda en fazla bir kez sorulur (gosterilsin ya da
 * sunucu "gerek yok" desin). Asil zamanlama (2 gunde bir, erteleme) sunucuda tutulur.
 */
let checkedThisSession = false;

/** Testler icin oturum bayragini sifirlar. */
export function resetWeightReminderSession() {
  checkedThisSession = false;
}

export type WeightReminderController = {
  visible: boolean;
  reminder: WeightReminderResponse | null;
  unit: UnitSystem;
  saving: boolean;
  errorMessage: string | null;
  save: (text: string) => Promise<boolean>;
  snooze: (action: WeightReminderSnoozeAction) => void;
};

/**
 * Kilo hatirlaticisi: ekran odaga geldiginde (yalnizca ana sayfa; antrenman ekranlari bunu kullanmaz,
 * dolayisiyla antrenman sirasinda acilmaz) kisa bir beklemeden sonra sunucuya sorar. `blocked` iken
 * (orn. rozet kutlamasi acik) sorulmaz ve odak tekrar geldiginde yeniden denenir.
 */
export function useWeightReminder({ blocked = false }: { blocked?: boolean } = {}): WeightReminderController {
  const { profile, isLoaded } = useProfile();
  const [reminder, setReminder] = useState<WeightReminderResponse | null>(null);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const blockedRef = useRef(blocked);
  blockedRef.current = blocked;
  const [focused, setFocused] = useState(false);

  // Ekrandan ayrilinca bekleyen soru iptal edilir; hatirlatici baska bir ekranin ustunde acilmaz.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    if (!focused || checkedThisSession || blocked) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (blockedRef.current || checkedThisSession) return;
      checkedThisSession = true;
      getWeightReminder(controller.signal)
        .then((response) => {
          if (controller.signal.aborted || blockedRef.current) {
            // Bu sefer gosterilemedi: oturumda bir kez daha denenebilsin.
            checkedThisSession = false;
            return;
          }
          setReminder(response);
          if (response.shouldPrompt) setVisible(true);
        })
        .catch(() => {
          if (controller.signal.aborted) checkedThisSession = false;
          // Diger hatalarda bu oturumda tekrar sorulmaz; hatirlatici kritik degildir.
        });
    }, WEIGHT_REMINDER_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [focused, blocked]);

  // Profil tercihi oncelikli; profil henuz yuklenmediyse sunucunun dondurdugu tercih kullanilir.
  const unit: UnitSystem = isLoaded
    ? profile.unitSystem === "imperial" ? "imperial" : "metric"
    : reminder?.unitSystem ?? "metric";

  const save = useCallback(
    async (text: string) => {
      const weightKg = parseWeightToKg(text, unit);
      if (weightKg === null) {
        setErrorMessage(unit === "imperial" ? "44 ile 881 lb arasında bir değer gir." : "20 ile 400 kg arasında bir değer gir.");
        return false;
      }
      setSaving(true);
      setErrorMessage(null);
      try {
        // Sunucu ayni gun icin tek kayit tutar (tekrar girilirse gunceller).
        await logWeight({ weightKg });
        setVisible(false);
        return true;
      } catch (error) {
        setErrorMessage(error instanceof ApiError ? error.message : "Kilo kaydedilemedi. Lütfen tekrar deneyin.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [unit],
  );

  const snooze = useCallback((action: WeightReminderSnoozeAction) => {
    setVisible(false);
    setErrorMessage(null);
    snoozeWeightReminder(action).catch(() => {
      // Erteleme yazilamazsa bu oturumda zaten tekrar sorulmaz; bir sonraki oturumda yeniden sorulur.
    });
  }, []);

  return { visible, reminder, unit, saving, errorMessage, save, snooze };
}
