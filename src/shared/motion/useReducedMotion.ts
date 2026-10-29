import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Cihazdaki "Hareketi azalt" (Reduce Motion / Animasyonlari kaldir) ayarini izler. Ayar acikken
 * dekoratif animasyonlar (gorsel gecisleri, maskot, konfeti) durdurulur veya aninda gosterilir.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((value) => {
        if (mounted) setReduced(Boolean(value));
      })
      .catch(() => {
        // Ayar okunamazsa animasyonlar normal calisir.
      });
    const subscription = AccessibilityInfo.addEventListener?.("reduceMotionChanged", (value) => setReduced(Boolean(value)));
    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reduced;
}
