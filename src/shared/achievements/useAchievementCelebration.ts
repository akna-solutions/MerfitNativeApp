import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { getAchievements, markAchievementsSeen } from "../../services/api/achievements";
import { AchievementItem } from "../../services/api/types";

/** Ayni oturumda rozet kontrolu en fazla bu siklikla yapilir (ana sayfaya her donuste istek atilmasin). */
export const ACHIEVEMENT_CHECK_INTERVAL_MS = 60_000;

let lastCheckAt = 0;
/** Bu oturumda kutlamasi gosterilmis rozetler; sunucuya "goruldu" yazilamasa bile tekrar gosterilmez. */
const shownIds = new Set<number>();

/** Yeni rozet kazanilmis olabilecek bir islemden sonra (orn. antrenman bitti) bir sonraki kontrolu hemen yaptirir. */
export function requestAchievementCheck() {
  lastCheckAt = 0;
}

/** Testler icin modul durumunu sifirlar. */
export function resetAchievementCelebrationState() {
  lastCheckAt = 0;
  shownIds.clear();
}

/**
 * Ekran odaga geldiginde yeni kazanilan rozetleri (GET /api/achievements -> newlyEarned) sirayla kutlar.
 * Bir rozet ekranda gosterildigi anda sunucuda "goruldu" isaretlenir; boylece uygulama kapansa bile
 * ayni rozet icin kutlama tekrar acilmaz.
 */
export function useAchievementCelebration() {
  const [queue, setQueue] = useState<AchievementItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastCheckAt < ACHIEVEMENT_CHECK_INTERVAL_MS) return;
      lastCheckAt = Date.now();
      const controller = new AbortController();
      getAchievements(controller.signal)
        .then((response) => {
          const fresh = response.newlyEarned.filter((item) => !shownIds.has(item.id));
          if (fresh.length === 0) return;
          setQueue((previous) => [...previous, ...fresh.filter((item) => !previous.some((p) => p.id === item.id))]);
        })
        .catch(() => {
          // Kutlama dekoratiftir; hata kullaniciya gosterilmez, bir sonraki odakta tekrar denenir.
          if (!controller.signal.aborted) lastCheckAt = 0;
        });
      return () => controller.abort();
    }, []),
  );

  const current = queue[0] ?? null;

  useEffect(() => {
    if (!current || shownIds.has(current.id)) return;
    shownIds.add(current.id);
    markAchievementsSeen([current.id]).catch(() => {
      // Yazilamazsa sunucu bir dahaki oturumda yeniden "yeni" dondurur; bu oturumda shownIds engeller.
    });
  }, [current]);

  const dismiss = useCallback(() => setQueue((previous) => previous.slice(1)), []);

  return { current, dismiss };
}
