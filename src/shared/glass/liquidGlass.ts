import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

/**
 * iOS 26+ gercek Liquid Glass (UIGlassEffect) destegi.
 *
 * - Yalnizca iOS'ta denenir; Android ve web her zaman mevcut MB Fit tasarimini (opak yuzeyler) kullanir.
 * - `isLiquidGlassAvailable()`: uygulama Liquid Glass bilesenleriyle derlenmis ve cihaz iOS 26+ mi?
 * - `isGlassEffectAPIAvailable()`: UIGlassEffect API'si calisma aninda gercekten var mi? (Bazi iOS 26 beta
 *   surumlerinde yok ve GlassView'i cizmek cokmeye yol acabiliyor; bkz. expo/expo#40911.)
 * - Native modul yoksa (orn. paket eklendikten sonra yeniden derlenmemis bir development build) `requireNativeModule`
 *   hata firlatir; bu durumda da sessizce fallback'e dusulur, uygulama cokmez.
 *
 * Sonuc surec boyunca degismedigi icin bir kez hesaplanip saklanir.
 */
let cachedSupport: boolean | undefined;

export function isLiquidGlassSupported(): boolean {
  if (cachedSupport !== undefined) return cachedSupport;
  if (Platform.OS !== "ios") {
    cachedSupport = false;
    return cachedSupport;
  }
  try {
    cachedSupport = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  } catch {
    cachedSupport = false;
  }
  return cachedSupport;
}

/** Testler icin onbellegi sifirlar. */
export function resetLiquidGlassSupportCache() {
  cachedSupport = undefined;
}

/**
 * Cihazdaki "Saydamligi azalt" (Reduce Transparency) ayarini izler. `isLiquidGlassAvailable` bu ayari hesaba
 * katmadigi icin ayri okunur; ayar acikken cam yerine opak MB Fit yuzeyleri gosterilir (Apple HIG: erisilebilirlik).
 */
export function useReduceTransparency(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    let mounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled?.()
      .then((value) => {
        if (mounted) setReduced(Boolean(value));
      })
      .catch(() => {
        // Ayar okunamazsa cam efekti normal kullanilir.
      });
    const subscription = AccessibilityInfo.addEventListener?.("reduceTransparencyChanged", (value) =>
      setReduced(Boolean(value)),
    );
    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reduced;
}

/** Bu ekranda gercek Liquid Glass cizilmeli mi? (iOS 26+, API mevcut, "Saydamligi azalt" kapali.) */
export function useLiquidGlass(): boolean {
  const reduceTransparency = useReduceTransparency();
  return isLiquidGlassSupported() && !reduceTransparency;
}

/**
 * Cam yuzeyler icin ince kenar ve icerik renkleri. Cam zaten arka plana gore kendini ayirdigi icin kenar cok
 * hafiftir; metinler tema renklerinden gelir, burada yalnizca cam ustunde daha yuksek kontrast isteyen pasif ikonlar var.
 */
export function glassTokens(isDark: boolean) {
  return isDark
    ? { edge: "rgba(255,255,255,0.16)", inactiveIcon: "rgba(255,255,255,0.78)", dimmedBackdrop: "rgba(0,0,0,0.35)" }
    : { edge: "rgba(255,255,255,0.65)", inactiveIcon: "rgba(11,13,18,0.62)", dimmedBackdrop: "rgba(0,0,0,0.22)" };
}

/** MB Fit mavisiyle cok hafif tonlanmis cam: puan / Plus gibi vurgu kartlari icin (mor ya da baska renk yok). */
export function glassBlueTint(isDark: boolean) {
  return isDark ? "rgba(62,123,250,0.16)" : "rgba(29,81,192,0.10)";
}
