import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useNavigationGuard } from "../../../shared/navigation/useNavigationGuard";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { useCart, useFavorites } from "../hooks";
import { storeRoutes } from "../navigation";
import { Product } from "../types";
import { isVariantSelectionComplete } from "../utils/pricing";
import { categoryIconFor } from "./categoryIcons";
import { PriceTag, DiscountBadge } from "./PriceTag";
import { ProductImage } from "./ProductImage";

type Props = {
  product: Product;
  /** Yatay listede sabit genislik; verilmezse kapsayiciyi doldurur (izgara). */
  width?: number;
};

function ProductCardBase({ product, width }: Props) {
  const router = useRouter();
  const guard = useNavigationGuard();
  const { colors } = useTheme();
  const { isFavorite, toggle } = useFavorites();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const favorite = isFavorite(product.id);
  const outOfStock = product.stock <= 0;
  // Varyant secimi gereken urunlerde hizli ekleme yerine detay acilir (secim yapilmadan sepete eklenmez).
  const needsSelection = !isVariantSelectionComplete(product, {});

  const openDetail = guard(() => router.push(storeRoutes.product(product.id)));

  const quickAdd = useCallback(async () => {
    if (outOfStock) return;
    if (needsSelection) {
      router.push(storeRoutes.product(product.id));
      return;
    }
    const result = await addToCart({ productId: product.id, quantity: 1, selectedVariant: {} });
    if (result.ok) {
      setAdded(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setAdded(false), 1400);
    }
  }, [addToCart, needsSelection, outOfStock, product.id, router]);

  return (
    // Kart bir View'dur; ayrintiya giden alan ve favori/ekle dugmeleri kardes Pressable'lardir (web'de ic ice <button> olmasin).
    <View style={[styles.card, width !== undefined ? { width } : styles.fill, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        testID={`product-card-${product.id}`}
        onPress={openDetail}
        accessibilityRole="button"
        accessibilityLabel={`${product.brand} ${product.name}, ${product.price} lira${outOfStock ? ", stokta yok" : ""}`}
      >
        <View>
          <ProductImage uri={product.images[0]} icon={categoryIconFor(product.categoryId)} label={product.brand} style={styles.image} />
          {product.discountPercentage > 0 ? (
            <View style={styles.badge}>
              <DiscountBadge percent={product.discountPercentage} />
            </View>
          ) : null}
          {outOfStock ? (
            <View style={[styles.soldOut, { backgroundColor: colors.background }]}>
              <Text style={[styles.soldOutText, { color: colors.textSecondary }]}>Tükendi</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <Text style={[styles.brand, { color: colors.textSecondary }]} numberOfLines={1}>
            {product.brand}
          </Text>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.priceCol}>
            <PriceTag price={product.price} originalPrice={product.discountPercentage > 0 ? product.originalPrice : undefined} />
          </View>
        </View>
      </Pressable>
      <Pressable
        testID={`favorite-${product.id}`}
        onPress={() => toggle(product.id)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={favorite ? `${product.name} favorilerden çıkar` : `${product.name} favorilere ekle`}
        accessibilityState={{ selected: favorite }}
        style={[styles.heart, { backgroundColor: colors.background }]}
      >
        <Ionicons name={favorite ? "heart" : "heart-outline"} size={17} color={favorite ? colors.danger : colors.text} />
      </Pressable>
      <Pressable
        testID={`quick-add-${product.id}`}
        onPress={quickAdd}
        disabled={outOfStock}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={outOfStock ? `${product.name} stokta yok` : needsSelection ? `${product.name} seçeneklerini göster` : `${product.name} sepete ekle`}
        accessibilityState={{ disabled: outOfStock }}
        style={[styles.addButton, { backgroundColor: outOfStock ? colors.inputBackground : colors.primary }]}
      >
        <Ionicons name={added ? "checkmark" : needsSelection ? "options-outline" : "add"} size={18} color={outOfStock ? colors.icon : "#FFFFFF"} />
      </Pressable>
    </View>
  );
}

export const ProductCard = memo(ProductCardBase);

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  fill: { flex: 1 },
  image: { width: "100%", aspectRatio: 1 },
  badge: { position: "absolute", top: 8, left: 8 },
  heart: { position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", opacity: 0.92 },
  soldOut: { position: "absolute", bottom: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, opacity: 0.92 },
  soldOutText: { fontSize: 11, fontWeight: "700" },
  body: { padding: 10, paddingBottom: 12, gap: 3 },
  brand: { fontSize: 11, fontWeight: "600" },
  name: { fontSize: 13, fontWeight: "600", minHeight: 34 },
  // Sag alttaki ekle dugmesine yer birakir.
  priceCol: { marginTop: 4, paddingRight: 38, minHeight: 36 },
  addButton: { position: "absolute", right: 10, bottom: 10, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
