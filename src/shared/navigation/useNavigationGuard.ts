import { useCallback, useRef } from "react";

/** Bir gecis baslatildiktan sonra ikinci dokunusun yok sayildigi sure (ms). */
export const NAVIGATION_GUARD_MS = 700;

/**
 * Hizli art arda dokunuslarda ayni ekranin iki kez acilmasini (cift push) engeller. Donen `guard`
 * ile sarilan fonksiyon, son cagridan bu yana NAVIGATION_GUARD_MS gecmediyse calismaz.
 *
 *   const guard = useNavigationGuard();
 *   <Pressable onPress={guard(() => router.push("/pages/leaderboard"))} />
 */
export function useNavigationGuard(windowMs: number = NAVIGATION_GUARD_MS) {
  const lastRef = useRef(0);

  return useCallback(
    <Args extends unknown[]>(action: (...args: Args) => void) =>
      (...args: Args) => {
        const now = Date.now();
        if (now - lastRef.current < windowMs) return;
        lastRef.current = now;
        action(...args);
      },
    [windowMs],
  );
}
