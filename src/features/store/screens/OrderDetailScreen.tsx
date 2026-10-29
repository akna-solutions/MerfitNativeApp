import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { EmptyState } from "../components/EmptyState";
import { OrderSummary } from "../components/OrderSummary";
import { ProductImage } from "../components/ProductImage";
import { GUTTER } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { StatusPill } from "../components/StatusPill";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STEPS, PAYMENT_LABELS, formatDate } from "../components/labels";
import { categoryIconFor } from "../components/categoryIcons";
import { useOrders, useStore } from "../hooks";
import { storeRoutes } from "../navigation";
import { formatPrice } from "../utils/pricing";

export function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { getOrder } = useOrders();
  const { productsById } = useStore();
  const order = id ? getOrder(id) : null;

  if (!order) {
    return (
      <StoreScreenShell title="Sipariş">
        <EmptyState icon="alert-circle-outline" title="Sipariş bulunamadı" message="Bu sipariş mevcut değil." actionLabel="Siparişlerim" onAction={() => router.replace(storeRoutes.orders())} testID="order-not-found" />
      </StoreScreenShell>
    );
  }
  const currentStep = ORDER_STATUS_STEPS.indexOf(order.status);

  return (
    <StoreScreenShell title="Sipariş Detayı" subtitle={order.id} testID="order-detail">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.title, { color: colors.text }]}>Durum</Text>
            <StatusPill status={order.status} />
          </View>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>Sipariş tarihi: {formatDate(order.createdAt)}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>Tahmini teslimat: {order.estimatedDelivery}</Text>
          <View style={styles.steps}>
            {ORDER_STATUS_STEPS.map((step, i) => (
              <View key={step} style={styles.step}>
                <Ionicons name={i <= currentStep ? "checkmark-circle" : "ellipse-outline"} size={18} color={i <= currentStep ? colors.primary : colors.icon} />
                <Text style={[styles.stepLabel, { color: i <= currentStep ? colors.text : colors.textSecondary }]} numberOfLines={2}>
                  {ORDER_STATUS_LABELS[step]}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[styles.note, { color: colors.textSecondary }]}>Sipariş durumları yalnızca demo verisidir; gerçek kargo takibi yapılmaz.</Text>
        </View>

        <Text style={[styles.heading, { color: colors.text }]}>Ürünler</Text>
        {order.items.map((item) => {
          const product = productsById.get(item.productId);
          return (
            <View key={`${item.productId}-${item.variantLabel}`} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ProductImage uri={item.image} icon={product ? categoryIconFor(product.categoryId) : undefined} style={styles.thumb} iconSize={20} />
              <View style={styles.itemText}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.variantLabel ? <Text style={[styles.meta, { color: colors.textSecondary }]}>{item.variantLabel}</Text> : null}
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {item.quantity} adet × {formatPrice(item.unitPrice)}
                </Text>
              </View>
              <Text style={[styles.itemName, { color: colors.text }]}>{formatPrice(item.unitPrice * item.quantity)}</Text>
            </View>
          );
        })}

        <Text style={[styles.heading, { color: colors.text }]}>Teslimat adresi</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.itemName, { color: colors.text }]}>
            {order.deliveryAddress.title} · {order.deliveryAddress.fullName}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>{order.deliveryAddress.address}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {order.deliveryAddress.district} / {order.deliveryAddress.city} · {order.deliveryAddress.phone}
          </Text>
        </View>

        <Text style={[styles.heading, { color: colors.text }]}>Ödeme</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.itemName, { color: colors.text }]}>{PAYMENT_LABELS[order.paymentMethod]}</Text>
        </View>
        <OrderSummary subtotal={order.subtotal} discount={order.discount} shippingCost={order.shippingCost} total={order.total} />
      </ScrollView>
    </StoreScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingBottom: 40, gap: 12 },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 15, fontWeight: "700" },
  meta: { fontSize: 12, lineHeight: 17 },
  note: { fontSize: 11, marginTop: 6 },
  steps: { flexDirection: "row", gap: 6, marginTop: 10 },
  step: { flex: 1, alignItems: "center", gap: 4 },
  stepLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  heading: { fontSize: 15, fontWeight: "700", marginTop: 8 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  itemText: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: "600" },
});
