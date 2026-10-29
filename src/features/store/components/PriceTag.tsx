import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { formatPrice } from "../utils/pricing";

type Props = {
  price: number;
  originalPrice?: number;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
  /** Her zaman koyu zeminli yuzeylerde (kampanya karti) tema rengi yerine acik renk kullanir. */
  onDark?: boolean;
};

const SIZES = { sm: 15, md: 18, lg: 24 } as const;

export function PriceTag({ price, originalPrice, size = "sm", align = "left", onDark = false }: Props) {
  const { colors } = useTheme();
  const hasDiscount = originalPrice !== undefined && originalPrice > price;
  return (
    <View style={[styles.wrap, align === "right" && styles.right]}>
      <Text style={[styles.price, { color: onDark ? "#FFFFFF" : colors.text, fontSize: SIZES[size] }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {formatPrice(price)}
      </Text>
      {hasDiscount ? (
        <Text style={[styles.old, { color: onDark ? "rgba(255,255,255,0.65)" : colors.textSecondary }]} numberOfLines={1}>
          {formatPrice(originalPrice)}
        </Text>
      ) : null}
    </View>
  );
}

export function DiscountBadge({ percent, testID }: { percent: number; testID?: string }) {
  const { colors } = useTheme();
  if (percent <= 0) return null;
  return (
    <View style={[styles.badge, { backgroundColor: colors.danger }]} testID={testID} accessibilityLabel={`Yüzde ${percent} indirim`}>
      <Text style={styles.badgeText}>%{percent}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", columnGap: 6 },
  right: { justifyContent: "flex-end" },
  price: { fontWeight: "800" },
  old: { fontSize: 12, textDecorationLine: "line-through" },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
});
