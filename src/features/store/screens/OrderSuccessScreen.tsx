import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { DumbbellSpinner } from "../../../shared/motion/DumbbellSpinner";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { BankTransferCard } from "../components/BankTransferCard";
import { EmptyState } from "../components/EmptyState";
import { OrderSummary } from "../components/OrderSummary";
import { GUTTER } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { PAYMENT_LABELS, PAYMENT_STATUS_LABELS } from "../components/labels";
import { useOrderDetail } from "../hooks";
import { storeRoutes } from "../navigation";
import { formatPrice } from "../utils/pricing";

export function OrderSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { order, isLoading, error, notFound, reload } = useOrderDetail(orderId);
  const goStore = () => router.replace(storeRoutes.home());

  if (isLoading && !order) {
    return (
      <StoreScreenShell title="Sipariş" onBack={goStore}>
        <View style={styles.centered} testID="order-success-loading">
          <DumbbellSpinner color={colors.primary} size="large" />
        </View>
      </StoreScreenShell>
    );
  }

  if (!order) {
    // Siparis olustu ama detay okunamadiysa (ag hatasi) kullaniciya siparisin kayboldugunu dusundurmeyelim.
    return (
      <StoreScreenShell title="Sipariş" onBack={goStore}>
        {notFound ? (
          <EmptyState icon="alert-circle-outline" title="Sipariş bulunamadı" actionLabel="MB Shop'a dön" onAction={goStore} testID="order-success-not-found" />
        ) : (
          <EmptyState
            icon="cloud-offline-outline"
            title="Sipariş bilgisi yüklenemedi"
            message={`${error ?? ""} Siparişin oluşturuldu; Siparişlerim ekranından da görebilirsin.`.trim()}
            actionLabel="Tekrar dene"
            onAction={reload}
            testID="order-success-error"
          />
        )}
      </StoreScreenShell>
    );
  }

  return (
    <StoreScreenShell
      title="Sipariş Alındı"
      onBack={goStore}
      testID="order-success"
      footer={
        <View style={styles.footer}>
          <Pressable onPress={() => router.replace(storeRoutes.orders())} accessibilityRole="button" testID="go-orders" style={[styles.cta, { backgroundColor: colors.primary }]}>
            <Text style={styles.ctaLabel}>Siparişlerime Git</Text>
          </Pressable>
          <Pressable onPress={goStore} accessibilityRole="button" testID="back-to-store" style={[styles.secondary, { borderColor: colors.border }]}>
            <Text style={[styles.secondaryLabel, { color: colors.text }]}>{"MB Shop'a Dön"}</Text>
          </Pressable>
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.check, { backgroundColor: colors.cardActive }]}>
            <Ionicons name="checkmark" size={38} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Siparişin alındı</Text>
          <Text style={[styles.orderNo, { color: colors.primary }]} testID="order-number" selectable>
            {order.orderNumber}
          </Text>
          <Text style={[styles.paymentLine, { color: colors.textSecondary }]} testID="order-success-payment">
            {PAYMENT_LABELS[order.paymentMethod]} · {PAYMENT_STATUS_LABELS[order.paymentStatus]}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {order.items.map((item, index) => (
            <View key={`${item.productId ?? "x"}-${item.variantLabel}-${index}`} style={styles.itemRow}>
              <View style={styles.itemText}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                  {item.quantity} × {item.name}
                </Text>
                {item.variantLabel ? <Text style={[styles.meta, { color: colors.textSecondary }]}>{item.variantLabel}</Text> : null}
              </View>
              <Text style={[styles.itemName, { color: colors.text }]}>{formatPrice(item.lineTotal)}</Text>
            </View>
          ))}
        </View>
        <OrderSummary subtotal={order.subtotal} discount={order.discount} shippingCost={order.shippingCost} total={order.total} />
        {order.bankTransfer ? <BankTransferCard info={order.bankTransfer} total={order.total} /> : null}
      </ScrollView>
    </StoreScreenShell>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, minHeight: 240, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: GUTTER, paddingBottom: 24, gap: 16 },
  hero: { alignItems: "center", gap: 8, paddingVertical: 12 },
  check: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  heroTitle: { fontSize: 20, fontWeight: "800" },
  orderNo: { fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  paymentLine: { fontSize: 12, textAlign: "center", lineHeight: 17, paddingHorizontal: 12 },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 10 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  itemText: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: "600" },
  meta: { fontSize: 12 },
  footer: { gap: 10 },
  cta: { height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  ctaLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  secondary: { height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  secondaryLabel: { fontSize: 14, fontWeight: "700" },
});
