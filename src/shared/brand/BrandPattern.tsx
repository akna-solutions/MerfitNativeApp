import { Ionicons } from "@expo/vector-icons";
import { memo, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";

type IconName = keyof typeof Ionicons.glyphMap;

/** Bolume gore desen ikonlari: MB Fit icin antrenman/beslenme, MB Shop icin alisveris. */
const ICONS: Record<"fit" | "shop", IconName[]> = {
  fit: [
    "barbell-outline",
    "bicycle-outline",
    "heart-outline",
    "nutrition-outline",
    "water-outline",
    "stopwatch-outline",
    "trophy-outline",
    "footsteps-outline",
    "fitness-outline",
    "walk-outline",
    "flame-outline",
    "medal-outline",
    "leaf-outline",
    "stats-chart-outline",
  ],
  shop: [
    "bag-handle-outline",
    "cart-outline",
    "pricetag-outline",
    "cube-outline",
    "gift-outline",
    "card-outline",
    "storefront-outline",
    "basket-outline",
    "barbell-outline",
    "nutrition-outline",
    "shirt-outline",
    "ribbon-outline",
  ],
};

const CELL = 86;

/** Deterministik sozde rastgele sayi (0..1): desen her acilista ve her cihazda ayni gorunur. */
function noise(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

type Props = {
  variant?: "fit" | "shop";
  /** Ikon rengi; koyu zeminde varsayilan cok soluk beyaz. */
  color?: string;
};

/**
 * Zeminde cok az belli olan, el ile serpistirilmis gibi duran ince cizgi ikon deseni. Ikonlar hafif
 * kaydirilmis bir izgaraya farkli boyut ve acilarla yerlesir; statiktir (animasyon yok).
 */
export const BrandPattern = memo(function BrandPattern({ variant = "fit", color = "rgba(255,255,255,0.045)" }: Props) {
  const { width, height } = useWindowDimensions();

  const cells = useMemo(() => {
    const icons = ICONS[variant];
    const cols = Math.ceil(width / CELL) + 1;
    const rows = Math.ceil(height / CELL) + 1;
    const out: { key: string; name: IconName; size: number; left: number; top: number; rotate: string }[] = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const seed = r * 97 + c * 31 + 7;
        const size = 30 + Math.round(noise(seed) * 12);
        out.push({
          key: `${r}-${c}`,
          name: icons[Math.floor(noise(seed + 1) * icons.length) % icons.length],
          size,
          left: c * CELL + (r % 2 ? CELL / 2 : 0) - CELL / 2 + (noise(seed + 2) - 0.5) * 18,
          top: r * CELL - CELL / 3 + (noise(seed + 3) - 0.5) * 18,
          rotate: `${Math.round((noise(seed + 4) - 0.5) * 40)}deg`,
        });
      }
    }
    return out;
  }, [variant, width, height]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID={`brand-pattern-${variant}`}>
      {cells.map((cell) => (
        <Ionicons
          key={cell.key}
          name={cell.name}
          size={cell.size}
          color={color}
          style={[styles.icon, { left: cell.left, top: cell.top, transform: [{ rotate: cell.rotate }] }]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  icon: { position: "absolute" },
});
