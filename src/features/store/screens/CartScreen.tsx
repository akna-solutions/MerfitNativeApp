import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { memo, useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { DumbbellSpinner } from "../../../shared/motion/DumbbellSpinner";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { EmptyState } from "../components/EmptyState";
import { OrderSummary } from "../components/OrderSummary";
import { PriceTag } from "../components/PriceTag";
import { ProductImage } from "../components/ProductImage";
import { QuantityStepper } from "../components/QuantityStepper";
import { GUTTER } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { useCart, useCategoryIcon, useStore } from "../hooks";
import { storeRoutes } from "../navigation";
import { CartLine as CartLineModel } from "../types";
import { formatPrice } from "../utils/pricing";

type LineProps = {
  item: CartLineModel;
  busy: boolean;
  onQuantity: (item: CartLineModel, next: number) => void;
  onRemove: (item: CartLineModel) => void;
  onOpen: (item: CartLineModel) => void;
};

const CartLine = memo(function CartLine({ item, busy, onQuantity, onRemove, onOpen }: LineProps) {
  const { colors } = useTheme();
  const icon = useCategoryIcon(item.categoryId);
  return (
    <View
      style={[styles.line, { backgroundColor: colors.card, borderColor: item.isAvailable ? colors.border : colors.danger, opacity: busy ? 0.6 : 1 }]}
      testID={`cart-line-${item.id}`}
    >
      <Pressable onPress={() => onOpen(item)} accessibilityRole="button" accessibilityLabel={`${item.name} detayı`}>
        <ProductImage uri={item.image} icon={icon} style={styles.thumb} iconSize={24} />
      </Pressable>
      <View style={styles.lineBody}>
        <View style={styles.lineTop}>
          <View style={styles.lineTitle}>
            <Text style={[styles.brand, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.brand}
            </Text>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
              {item.name}
            </Text>
            {item.variantLabel ? (
              <Text style={[styles.variant, { color: colors.textSecondary }]} numberOfLines={1} testID={`cart-variant-${item.id}`}>
                {item.variantLabel}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={() => onRemove(item)} disabled={busy} hitSlop={10} accessibilityRole="button" accessibilityLabel={`${item.name} sepetten kaldır`} testID={`cart-remove-${item.id}`}>
            <Ionicons name="close" size={20} color={colors.icon} />
          </Pressable>
        </View>
        {!item.isAvailable ? (
          <View style={styles.unavailable} testID={`cart-unavailable-${item.id}`}>
            <Ionicons name="alert-circle" size={14} color={colors.danger} />
            <Text style={[styles.unavailableText, { color: colors.danger }]}>{item.unavailableReason ?? "Bu ürün şu anda satın alınamıyor."}</Text>
          </View>
        ) : null}
        <View style={styles.lineBottom}>
          <QuantityStepper
            value={item.quantity}
            max={Math.max(item.maxQuantity, item.isAvailable ? 1 : 0)}
            allowRemove
            label={`${item.name} adet`}
            testID={`cart-qty-${item.id}`}
            onChange={(n) => onQuantity(item, n)}
          />
          <View style={styles.linePrices}>
            <PriceTag price={item.lineTotal} originalPrice={item.lineOriginalTotal > item.lineTotal ? item.lineOriginalTotal : undefined} align="right" />
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
  const { isLoading, error: storeError, reload } = useStore();
  const { cart, items, totals, setQuantity, remove, refresh } = useCart();
  const [busyLine, setBusyLine] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Ekran her acildiginda sepet sunucudan yenilenir (fiyat/stok baska cihazda ya da adminde degismis olabilir).
  useFocusEffect(
    useCallback(() => {
      if (!isLoading && !storeError) void refresh();
    }, [isLoading, storeError, refresh]),
  );

  const goStore = () => router.replace(storeRoutes.home());

  const onQuantity = useCallback(
    async (item: CartLineModel, next: number) => {
      setBusyLine(item.id);
      setNotice(null);
      const result = await setQuantity(item.id, next);
      setBusyLine(null);
      if (!result.ok) setNotice(result.message);
    },
    [setQuantity],
  );
  const onRemove = useCallback(
    async (item: CartLineModel) => {
      setBusyLine(item.id);
      setNotice(null);
      const result = await remove(item.id);
      setBusyLine(null);
      if (!result.ok) setNotice(result.message);
    },
    [remove],
  );
  const onOpen = useCallback((item: CartLineModel) => router.push(storeRoutes.product(item.productId)), [router]);
  const onRefresh = async () => {
    setRefreshing(true);
    const result = await refresh();
    setRefreshing(false);
    setNotice(result.ok ? null : result.message);
  };

  if (storeError) {
    return (
      <StoreScreenShell title="Sepetim" testID="cart-screen">
        <EmptyState icon="cloud-offline-outline" title="Sepet yüklenemedi" message={storeError} actionLabel="Tekrar dene" onAction={reload} testID="cart-error" />
      </StoreScreenShell>
    );
  }

  if (isLoading) {
    return (
      <StoreScreenShell title="Sepetim" testID="cart-screen">
        <View style={styles.centered} testID="cart-loading">
          <DumbbellSpinner color={colors.primary} size="large" />
        </View>
      </StoreScreenShell>
    );
  }

  if (items.length === 0) {
    return (
      <StoreScreenShell title="Sepetim" testID="cart-screen">
        <EmptyState icon="cart-outline" title="Sepetin boş" message="Beğendiğin ürünleri sepete ekleyerek alışverişe başlayabilirsin." actionLabel="MB Shop'a dön" onAction={goStore} testID="cart-empty" />
      </StoreScreenShell>
    );
  }

  const blocked = !cart.canCheckout;

  return (
    <StoreScreenShell
      title="Sepetim"
      subtitle={`${totals.itemCount} ürün`}
      testID="cart-screen"
      footer={
        <View style={styles.footerWrap}>
          {blocked ? (
            <Text style={[styles.notice, { color: colors.danger }]} testID="cart-blocked">
              Satın alınamayan ürünleri sepetten çıkar veya adedini azalt.
            </Text>
          ) : null}
          <View style={styles.footer}>
            <View style={styles.footerTotal}>
              <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Genel toplam</Text>
              <Text style={[styles.footerValue, { color: colors.text }]} testID="cart-footer-total">
                {formatPrice(totals.total)}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push(storeRoutes.checkout())}
              disabled={blocked}
              accessibilityRole="button"
              accessibilityState={{ disabled: blocked }}
              testID="go-checkout"
              style={[styles.cta, { backgroundColor: blocked ? colors.inputBackground : colors.primary }]}
            >
              <Text style={[styles.ctaLabel, blocked && { color: colors.icon }]}>Ödeme Adımına Geç</Text>
            </Pressable>
          </View>
        </View>
      }
    >
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <CartLine item={item} busy={busyLine === item.id} onQuantity={onQuantity} onRemove={onRemove} onOpen={onOpen} />}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          notice ? (
            <View style={[styles.banner, { backgroundColor: colors.dangerBackground }]} testID="cart-notice" accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={[styles.notice, styles.flex, { color: colors.danger }]}>{notice}</Text>
            </View>
          ) : undefined
        }
        ListFooterComponent={
          <View style={styles.listFooter}>
            <OrderSummary {...totals} />
            <Pressable onPress={goStore} accessibilityRole="button" testID="continue-shopping" style={[styles.secondary, { borderColor: colors.border }]}>
              <Text style={[styles.secondaryLabel, { color: colors.text }]}>Alışverişe Devam Et</Text>
            </Pressable>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
    </StoreScreenShell>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, minHeight: 240, alignItems: "center", justifyContent: "center" },
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
  unavailable: { flexDirection: "row", alignItems: "center", gap: 6 },
  unavailableText: { flex: 1, fontSize: 12, fontWeight: "600" },
  lineBottom: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8 },
  linePrices: { flex: 1, alignItems: "flex-end" },
  unit: { fontSize: 11, marginTop: 2 },
  banner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, marginBottom: 12 },
  notice: { fontSize: 13, fontWeight: "600" },
  listFooter: { marginTop: 20, gap: 14 },
  footerWrap: { gap: 8 },
  footer: { flexDirection: "row", alignItems: "center", gap: 14 },
  footerTotal: { gap: 2 },
  footerLabel: { fontSize: 12 },
  footerValue: { fontSize: 18, fontWeight: "800" },
  cta: { flex: 1, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  ctaLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  secondary: { height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  secondaryLabel: { fontSize: 14, fontWeight: "700" },
});
