import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { EmptyState } from "../components/EmptyState";
import { OrderSummary } from "../components/OrderSummary";
import { GUTTER } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { PAYMENT_LABELS } from "../components/labels";
import { useOrders } from "../hooks";
import { storeRoutes } from "../navigation";
import { formatPrice } from "../utils/pricing";

export function OrderSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { getOrder } = useOrders();
  const order = orderId ? getOrder(orderId) : null;
  const goStore = () => router.replace(storeRoutes.home());

  if (!order) {
    return (
      <StoreScreenShell title="Sipariş" onBack={goStore}>
        <EmptyState icon="alert-circle-outline" title="Sipariş bulunamadı" actionLabel="Store'a dön" onAction={goStore} />
      </StoreScreenShell>
    );
  }

  return (
    <StoreScreenShell
      title="Sipariş Tamamlandı"
      onBack={goStore}
      testID="order-success"
      footer={
        <View style={styles.footer}>
          <Pressable onPress={() => router.replace(storeRoutes.orders())} accessibilityRole="button" testID="go-orders" style={[styles.cta, { backgroundColor: colors.primary }]}>
            <Text style={styles.ctaLabel}>Siparişlerime Git</Text>
          </Pressable>
          <Pressable onPress={goStore} accessibilityRole="button" testID="back-to-store" style={[styles.secondary, { borderColor: colors.border }]}>
            <Text style={[styles.secondaryLabel, { color: colors.text }]}>{"Store'a Dön"}</Text>
          </Pressable>
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.check, { backgroundColor: colors.cardActive }]}>
            <Ionicons name="checkmark" size={38} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Demo siparişin alındı</Text>
          <Text style={[styles.orderNo, { color: colors.primary }]} testID="order-number" selectable>
            {order.id}
          </Text>
          <Text style={[styles.demo, { color: colors.textSecondary }]}>Bu bir demo siparişidir; gerçek ödeme alınmadı ve gerçek bir gönderim yapılmayacak.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {order.items.map((item) => (
            <View key={`${item.productId}-${item.variantLabel}`} style={styles.itemRow}>
              <View style={styles.itemText}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                  {item.quantity} × {item.name}
                </Text>
                {item.variantLabel ? <Text style={[styles.meta, { color: colors.textSecondary }]}>{item.variantLabel}</Text> : null}
              </View>
              <Text style={[styles.itemName, { color: colors.text }]}>{formatPrice(item.unitPrice * item.quantity)}</Text>
            </View>
          ))}
        </View>
        <OrderSummary subtotal={order.subtotal} discount={order.discount} shippingCost={order.shippingCost} total={order.total} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.itemName, { color: colors.text }]}>{PAYMENT_LABELS[order.paymentMethod]}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>Tahmini teslimat: {order.estimatedDelivery}</Text>
        </View>
      </ScrollView>
    </StoreScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingBottom: 24, gap: 16 },
  hero: { alignItems: "center", gap: 8, paddingVertical: 12 },
  check: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  heroTitle: { fontSize: 20, fontWeight: "800" },
  orderNo: { fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  demo: { fontSize: 12, textAlign: "center", lineHeight: 17, paddingHorizontal: 12 },
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
