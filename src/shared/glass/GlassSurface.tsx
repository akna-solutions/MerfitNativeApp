import { GlassContainer, GlassView } from "expo-glass-effect";
import type { ReactNode } from "react";
import { ColorValue, StyleProp, View, ViewProps, ViewStyle } from "react-native";

import { useTheme } from "../theme/ThemeContext";
import { useLiquidGlass } from "./liquidGlass";

type GlassSurfaceProps = ViewProps & {
  /** "regular": okunabilirlik oncelikli, kartlar/navbar/modal; "clear": medya ustundeki hafif kontroller. */
  variant?: "regular" | "clear";
  tintColor?: ColorValue;
  /** Dokunuldugunda camin parlayip esnemesi (yalnizca dokunulabilir yuzeylerde). */
  interactive?: boolean;
  /** Cam yokken (Android, iOS 25 ve alti, "Saydamligi azalt") uygulanan mevcut MB Fit zemini/kenarligi. */
  fallbackStyle?: StyleProp<ViewStyle>;
  /** Cam cizilirken eklenen stil (orn. ince kenar ya da daha az dolgu). */
  glassStyle?: StyleProp<ViewStyle>;
  /** Ust bilesen destegi zaten hesapladiysa iletir; verilmezse burada okunur. */
  enabled?: boolean;
  /** Varsayilan: uygulamanin tema secimi. Her zaman koyu olan ekranlar (orn. karsilama videosu) "dark" verir. */
  colorScheme?: "light" | "dark";
};

/**
 * Tek bir cam yuzey. iOS 26+ cihazlarda native `GlassView` (UIGlassEffect) cizer: arkadaki gercek icerik sistem
 * tarafindan bulaniklastirilir ve kirilir. Diger her durumda ayni yerlesimle siradan bir `View` + `fallbackStyle`
 * cizer; boylece Android ve eski iOS'ta mevcut tasarim aynen korunur.
 *
 * Not: Apple'in cam efekti, kendisinde ya da ust gorunumlerinde `opacity < 1` varken bozuk cizilir. Basili durum
 * geri bildirimi icin opaklik yerine olcek (transform) kullanin.
 */
export function GlassSurface({
  variant = "regular",
  tintColor,
  interactive = false,
  fallbackStyle,
  glassStyle,
  enabled,
  colorScheme,
  style,
  children,
  ...rest
}: GlassSurfaceProps) {
  const supported = useLiquidGlass();
  const { isDark } = useTheme();
  const useGlass = enabled ?? supported;

  if (!useGlass) {
    return (
      <View style={[style, fallbackStyle]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <GlassView
      glassEffectStyle={variant}
      tintColor={tintColor}
      isInteractive={interactive}
      // Uygulamanin kendi tema secimi (Ayarlar > Gorunum) sistem temasindan farkli olabilir.
      colorScheme={colorScheme ?? (isDark ? "dark" : "light")}
      style={[{ overflow: "hidden" }, style, glassStyle]}
      {...rest}
    >
      {children}
    </GlassView>
  );
}

type GlassGroupProps = ViewProps & {
  /** Cam yuzeylerin birbirine bu mesafeden yakinken akiskan sekilde birlesmeye basladigi aralik. */
  spacing?: number;
  enabled?: boolean;
  children?: ReactNode;
};

/**
 * Birden fazla `GlassSurface`'i tek bir cam katmaninda toplar (`GlassContainer`): yakin yuzeyler birbirine
 * karisir ve animasyonlarda birlikte sekil degistirir. Cam yoksa siradan `View`'dir.
 */
export function GlassGroup({ spacing, enabled, children, ...rest }: GlassGroupProps) {
  const supported = useLiquidGlass();
  const useGlass = enabled ?? supported;
  if (!useGlass) return <View {...rest}>{children}</View>;
  return (
    <GlassContainer spacing={spacing} {...rest}>
      {children}
    </GlassContainer>
  );
}
