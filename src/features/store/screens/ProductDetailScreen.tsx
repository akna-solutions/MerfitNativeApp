import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { CartButton } from "../components/HeaderButtons";
import { EmptyState } from "../components/EmptyState";
import { DiscountBadge, PriceTag } from "../components/PriceTag";
import { ProductImage } from "../components/ProductImage";
import { QuantityStepper } from "../components/QuantityStepper";
import { GUTTER, ProductRow, SectionHeader } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { categoryIconFor } from "../components/categoryIcons";
import { useCart, useFavorites, useProduct, useStore } from "../hooks";
import { storeRoutes } from "../navigation";
import { Product, SelectedVariant, VariantGroup } from "../types";
import { relatedProducts, similarProducts } from "../utils/catalog";
import { formatPrice, isVariantSelectionComplete, maxQuantityFor, originalUnitPriceFor, unitPriceFor } from "../utils/pricing";

function stockInfo(product: Product): { label: string; tone: "ok" | "low" | "out" } {
  if (product.stock <= 0) return { label: "Stokta yok", tone: "out" };
  if (product.stock <= 10) return { label: `Son ${product.stock} ürün`, tone: "low" };
  return { label: "Stokta var", tone: "ok" };
}

export function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useProduct(id);
  const { isLoading } = useStore();

  if (!product) {
    return (
      <StoreScreenShell title="Ürün">
        {isLoading ? (
          <EmptyState icon="hourglass-outline" title="Ürün yükleniyor" />
        ) : (
          <EmptyState icon="alert-circle-outline" title="Ürün bulunamadı" message="Bu ürün kaldırılmış veya bağlantı hatalı olabilir." testID="product-not-found" />
        )}
      </StoreScreenShell>
    );
  }
  // key: benzer urune gidildiginde secim/adet durumu sifirlansin.
  return <ProductDetailContent key={product.id} product={product} />;
}

function ProductDetailContent({ product }: { product: Product }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { products, categories } = useStore();
  const { addToCart } = useCart();
  const { isFavorite, toggle } = useFavorites();

  const [selected, setSelected] = useState<SelectedVariant>({});
  const [quantity, setQuantity] = useState(product.stock > 0 ? 1 : 0);
  const [showErrors, setShowErrors] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [page, setPage] = useState(0);

  const outOfStock = product.stock <= 0;
  const maxQty = maxQuantityFor(product);
  const complete = isVariantSelectionComplete(product, selected);
  const unitPrice = unitPriceFor(product, selected);
  const originalUnit = originalUnitPriceFor(product, selected);
  const stock = stockInfo(product);
  const favorite = isFavorite(product.id);
  const category = categories.find((c) => c.id === product.categoryId);
  const icon = categoryIconFor(product.categoryId);

  const slides = product.images.length > 0 ? product.images : [null];
  const similar = useMemo(() => similarProducts(product, products), [product, products]);
  const related = useMemo(() => relatedProducts(product, products), [product, products]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  const add = async (): Promise<boolean> => {
    if (outOfStock) return false;
    if (!complete) {
      setShowErrors(true);
      setNotice({ text: "Lütfen önce seçenekleri belirleyin.", error: true });
      return false;
    }
    const result = await addToCart({ productId: product.id, quantity, selectedVariant: selected });
    if (!result.ok) {
      setNotice({ text: result.message, error: true });
      return false;
    }
    setNotice({ text: `${quantity} adet sepete eklendi.` });
    return true;
  };

  const buyNow = async () => {
    if (await add()) router.push(storeRoutes.checkout());
  };

  const footer = (
    <View style={styles.footerWrap}>
      {notice ? (
        <View style={styles.noticeRow} testID="detail-notice" accessibilityLiveRegion="polite">
          <Ionicons name={notice.error ? "alert-circle" : "checkmark-circle"} size={16} color={notice.error ? colors.danger : colors.primary} />
          <Text style={[styles.noticeText, { color: notice.error ? colors.danger : colors.text }]} numberOfLines={2}>
            {notice.text}
          </Text>
          {!notice.error ? (
            <Pressable onPress={() => router.push(storeRoutes.cart())} hitSlop={8} accessibilityRole="button">
              <Text style={[styles.noticeLink, { color: colors.primary }]}>Sepete git</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={styles.footerRow}>
        <View>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Toplam</Text>
          <Text style={[styles.totalValue, { color: colors.text }]} testID="detail-total">
            {formatPrice(unitPrice * quantity)}
          </Text>
        </View>
        <Pressable
          testID="add-to-cart"
          onPress={add}
          disabled={outOfStock}
          accessibilityRole="button"
          accessibilityLabel={outOfStock ? "Stokta yok" : "Sepete ekle"}
          accessibilityState={{ disabled: outOfStock }}
          style={[styles.secondaryCta, { borderColor: outOfStock ? colors.border : colors.primary }]}
        >
          <Text style={[styles.secondaryLabel, { color: outOfStock ? colors.icon : colors.primary }]}>{outOfStock ? "Tükendi" : "Sepete Ekle"}</Text>
        </Pressable>
        <Pressable
          testID="buy-now"
          onPress={buyNow}
          disabled={outOfStock}
          accessibilityRole="button"
          accessibilityLabel="Hemen satın al"
          accessibilityState={{ disabled: outOfStock }}
          style={[styles.primaryCta, { backgroundColor: outOfStock ? colors.inputBackground : colors.primary }]}
        >
          <Text style={[styles.primaryLabel, { color: outOfStock ? colors.icon : "#FFFFFF" }]}>Hemen Al</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <StoreScreenShell
      title={category?.name ?? "Ürün"}
      right={
        <>
          <Pressable
            testID="detail-favorite"
            onPress={() => toggle(product.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
            accessibilityState={{ selected: favorite }}
            style={[styles.headerButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
          >
            <Ionicons name={favorite ? "heart" : "heart-outline"} size={20} color={favorite ? colors.danger : colors.text} />
          </Pressable>
          <CartButton />
        </>
      }
      footer={footer}
      testID="product-detail"
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FlatList
          testID="gallery"
          data={slides}
          keyExtractor={(item, index) => `${item ?? "placeholder"}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => <ProductImage uri={item} icon={icon} label={product.brand} iconSize={64} style={{ width, height: width * 0.82 }} />}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        />
        {slides.length > 1 ? (
          <View style={styles.dots} accessibilityLabel={`Görsel ${page + 1} / ${slides.length}`}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i === page ? colors.primary : colors.progressTrack }]} />
            ))}
          </View>
        ) : null}

        <View style={styles.body}>
          <Text style={[styles.brand, { color: colors.primary }]}>{product.brand}</Text>
          <Text style={[styles.name, { color: colors.text }]} accessibilityRole="header">
            {product.name}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F5B301" />
            <Text style={[styles.rating, { color: colors.text }]}>{product.rating.toFixed(1)}</Text>
            <Text style={[styles.reviews, { color: colors.textSecondary }]}>({product.reviewCount} değerlendirme)</Text>
          </View>

          <View style={styles.priceRow}>
            <PriceTag price={unitPrice} originalPrice={product.discountPercentage > 0 ? originalUnit : undefined} size="lg" />
            <DiscountBadge percent={product.discountPercentage} testID="detail-discount" />
          </View>
          <View style={[styles.stockChip, { backgroundColor: stock.tone === "out" ? colors.dangerBackground : colors.cardActive }]} testID="detail-stock">
            <Text style={[styles.stockText, { color: stock.tone === "out" ? colors.danger : colors.primary }]}>{stock.label}</Text>
          </View>

          {product.variants.map((group) => (
            <VariantPicker
              key={group.id}
              group={group}
              value={selected[group.id]}
              showError={showErrors && !selected[group.id]}
              onSelect={(optionId) => {
                setSelected((s) => ({ ...s, [group.id]: optionId }));
                setNotice(null);
              }}
            />
          ))}

          {!outOfStock ? (
            <View style={styles.qtyRow}>
              <Text style={[styles.groupLabel, { color: colors.text }]}>Adet</Text>
              <QuantityStepper value={quantity} max={maxQty} onChange={(n) => setQuantity(Math.max(1, Math.min(n, maxQty)))} testID="detail-qty" />
            </View>
          ) : null}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ürün Açıklaması</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{product.description}</Text>

          {product.features.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ürün Özellikleri</Text>
              {product.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>{f}</Text>
                </View>
              ))}
            </>
          ) : null}

          {product.specs.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Kullanım ve Teknik Bilgiler</Text>
              <View style={[styles.specs, { borderColor: colors.border, backgroundColor: colors.card }]}>
                {product.specs.map((s, i) => (
                  <View key={s.label} style={[styles.specRow, i > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                    <Text style={[styles.specLabel, { color: colors.textSecondary }]}>{s.label}</Text>
                    <Text style={[styles.specValue, { color: colors.text }]}>{s.value}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </View>

        {similar.length > 0 ? (
          <View style={styles.relatedBlock} testID="similar-products">
            <SectionHeader title="Benzer Ürünler" />
            <ProductRow products={similar} />
          </View>
        ) : null}
        {related.length > 0 ? (
          <View style={styles.relatedBlock} testID="related-products">
            <SectionHeader title="İlgili Ürünler" />
            <ProductRow products={related} />
          </View>
        ) : null}
      </ScrollView>
    </StoreScreenShell>
  );
}

function VariantPicker({ group, value, showError, onSelect }: { group: VariantGroup; value: string | undefined; showError: boolean; onSelect: (optionId: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.variantBlock} testID={`variant-${group.id}`}>
      <Text style={[styles.groupLabel, { color: showError ? colors.danger : colors.text }]}>
        {group.label}
        {showError ? " seçin" : ""}
      </Text>
      <View style={styles.optionRow}>
        {group.options.map((option) => {
          const isSelected = value === option.id;
          const disabled = option.inStock === false;
          const isColor = group.kind === "color" && option.swatch;
          return (
            <Pressable
              key={option.id}
              testID={`variant-${group.id}-${option.id}`}
              onPress={() => onSelect(option.id)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`${group.label}: ${option.label}${disabled ? ", stokta yok" : ""}`}
              accessibilityState={{ selected: isSelected, disabled }}
              style={[
                styles.option,
                {
                  borderColor: isSelected ? colors.primary : showError ? colors.danger : colors.border,
                  backgroundColor: isSelected ? colors.cardActive : colors.inputBackground,
                  opacity: disabled ? 0.45 : 1,
                },
              ]}
            >
              {isColor ? <View style={[styles.swatch, { backgroundColor: option.swatch, borderColor: colors.border }]} /> : null}
              <Text style={[styles.optionLabel, { color: isSelected ? colors.primary : colors.text }, disabled && styles.struck]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  headerButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  body: { paddingHorizontal: GUTTER, paddingTop: 16, gap: 6 },
  brand: { fontSize: 13, fontWeight: "700" },
  name: { fontSize: 21, fontWeight: "800", lineHeight: 27 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  rating: { fontSize: 13, fontWeight: "700" },
  reviews: { fontSize: 12 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  stockChip: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 8 },
  stockText: { fontSize: 12, fontWeight: "700" },
  variantBlock: { marginTop: 18, gap: 10 },
  groupLabel: { fontSize: 14, fontWeight: "700" },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { minHeight: 44, minWidth: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  optionLabel: { fontSize: 13, fontWeight: "600" },
  struck: { textDecorationLine: "line-through" },
  swatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1 },
  qtyRow: { marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 24, marginBottom: 4 },
  paragraph: { fontSize: 14, lineHeight: 21 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 3 },
  featureText: { fontSize: 14, flex: 1 },
  specs: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginTop: 6 },
  specRow: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 12, paddingHorizontal: 14 },
  specLabel: { fontSize: 13, width: "32%" },
  specValue: { fontSize: 13, fontWeight: "600", flex: 1, textAlign: "right" },
  relatedBlock: { marginTop: 28 },
  footerWrap: { gap: 10 },
  noticeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  noticeText: { flex: 1, fontSize: 13, fontWeight: "600" },
  noticeLink: { fontSize: 13, fontWeight: "700" },
  footerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  totalLabel: { fontSize: 11 },
  totalValue: { fontSize: 16, fontWeight: "800" },
  secondaryCta: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  secondaryLabel: { fontSize: 14, fontWeight: "700" },
  primaryCta: { flex: 1, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  primaryLabel: { fontSize: 14, fontWeight: "700" },
});
