import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { EmptyState } from "../components/EmptyState";
import { OrderSummary } from "../components/OrderSummary";
import { PriceTag } from "../components/PriceTag";
import { ProductImage } from "../components/ProductImage";
import { QuantityStepper } from "../components/QuantityStepper";
import { GUTTER } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { categoryIconFor } from "../components/categoryIcons";
import { useCart } from "../hooks";
import { storeRoutes } from "../navigation";
import { CartItem, Product } from "../types";
import { formatPrice, maxQuantityFor, originalUnitPriceFor, variantKey, variantLabel } from "../utils/pricing";

type LineProps = {
  item: CartItem;
  product: Product;
  onQuantity: (item: CartItem, next: number) => void;
  onRemove: (item: CartItem) => void;
  onOpen: (product: Product) => void;
};

const CartLine = memo(function CartLine({ item, product, onQuantity, onRemove, onOpen }: LineProps) {
  const { colors } = useTheme();
  const label = variantLabel(product, item.selectedVariant);
  const original = originalUnitPriceFor(product, item.selectedVariant);
  return (
    <View style={[styles.line, { backgroundColor: colors.card, borderColor: colors.border }]} testID={`cart-line-${product.id}`}>
      <Pressable onPress={() => onOpen(product)} accessibilityRole="button" accessibilityLabel={`${product.name} detayı`}>
        <ProductImage uri={product.images[0]} icon={categoryIconFor(product.categoryId)} style={styles.thumb} iconSize={24} />
      </Pressable>
      <View style={styles.lineBody}>
        <View style={styles.lineTop}>
          <View style={styles.lineTitle}>
            <Text style={[styles.brand, { color: colors.textSecondary }]} numberOfLines={1}>
              {product.brand}
            </Text>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
              {product.name}
            </Text>
            {label ? (
              <Text style={[styles.variant, { color: colors.textSecondary }]} numberOfLines={1} testID={`cart-variant-${product.id}`}>
                {label}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={() => onRemove(item)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`${product.name} sepetten kaldır`} testID={`cart-remove-${product.id}`}>
            <Ionicons name="close" size={20} color={colors.icon} />
          </Pressable>
        </View>
        <View style={styles.lineBottom}>
          <QuantityStepper
            value={item.quantity}
            max={maxQuantityFor(product)}
            allowRemove
            label={`${product.name} adet`}
            testID={`cart-qty-${product.id}`}
            onChange={(n) => onQuantity(item, n)}
          />
          <View style={styles.linePrices}>
            <PriceTag price={item.unitPrice * item.quantity} originalPrice={original > item.unitPrice ? original * item.quantity : undefined} align="right" />
            {item.quantity > 1 ? (
              <Text style={[styles.unit, { color: colors.textSecondary }]}>Birim: {formatPrice(item.unitPrice)}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
});

export function CartScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { items, totals, productsById, setQuantity, remove } = useCart();

  const goStore = () => router.replace(storeRoutes.home());

  if (items.length === 0) {
    return (
      <StoreScreenShell title="Sepetim" testID="cart-screen">
        <EmptyState icon="cart-outline" title="Sepetin boş" message="Beğendiğin ürünleri sepete ekleyerek alışverişe başlayabilirsin." actionLabel="MB Shop'a dön" onAction={goStore} testID="cart-empty" />
      </StoreScreenShell>
    );
  }

  return (
    <StoreScreenShell
      title="Sepetim"
      subtitle={`${totals.itemCount} ürün`}
      testID="cart-screen"
      footer={
        <View style={styles.footer}>
          <View style={styles.footerTotal}>
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Genel toplam</Text>
            <Text style={[styles.footerValue, { color: colors.text }]} testID="cart-footer-total">
              {formatPrice(totals.total)}
            </Text>
          </View>
          <Pressable onPress={() => router.push(storeRoutes.checkout())} accessibilityRole="button" testID="go-checkout" style={[styles.cta, { backgroundColor: colors.primary }]}>
            <Text style={styles.ctaLabel}>Ödeme Adımına Geç</Text>
          </Pressable>
        </View>
      }
    >
      <FlatList
        data={items}
        keyExtractor={(i) => `${i.productId}:${variantKey(i.selectedVariant)}`}
        renderItem={({ item }) => {
          const product = productsById.get(item.productId);
          if (!product) return null;
          return <CartLine item={item} product={product} onQuantity={(it, n) => setQuantity(it.productId, it.selectedVariant, n)} onRemove={(it) => remove(it.productId, it.selectedVariant)} onOpen={(p) => router.push(storeRoutes.product(p.id))} />;
        }}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <View style={styles.listFooter}>
            <OrderSummary {...totals} remainingForFreeShipping={totals.remainingForFreeShipping} />
            <Pressable onPress={goStore} accessibilityRole="button" testID="continue-shopping" style={[styles.secondary, { borderColor: colors.border }]}>
              <Text style={[styles.secondaryLabel, { color: colors.text }]}>Alışverişe Devam Et</Text>
            </Pressable>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </StoreScreenShell>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: GUTTER, paddingBottom: 24 },
  sep: { height: 12 },
  line: { flexDirection: "row", gap: 12, padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  thumb: { width: 84, height: 84, borderRadius: 10 },
  lineBody: { flex: 1, gap: 10 },
  lineTop: { flexDirection: "row", gap: 8 },
  lineTitle: { flex: 1, gap: 2 },
  brand: { fontSize: 11, fontWeight: "600" },
  name: { fontSize: 14, fontWeight: "600" },
  variant: { fontSize: 12 },
  lineBottom: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8 },
  linePrices: { flex: 1, alignItems: "flex-end" },
  unit: { fontSize: 11, marginTop: 2 },
  listFooter: { marginTop: 20, gap: 14 },
  footer: { flexDirection: "row", alignItems: "center", gap: 14 },
  footerTotal: { gap: 2 },
  footerLabel: { fontSize: 12 },
  footerValue: { fontSize: 18, fontWeight: "800" },
  cta: { flex: 1, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  ctaLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  secondary: { height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  secondaryLabel: { fontSize: 14, fontWeight: "700" },
});
