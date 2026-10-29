import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { DumbbellSpinner } from "../../../shared/motion/DumbbellSpinner";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { BankTransferCard } from "../components/BankTransferCard";
import { EmptyState } from "../components/EmptyState";
import { OrderSummary } from "../components/OrderSummary";
import { ProductImage } from "../components/ProductImage";
import { GUTTER } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { StatusPill } from "../components/StatusPill";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STEPS, PAYMENT_LABELS, PAYMENT_STATUS_LABELS, formatDate } from "../components/labels";
import { useOrderDetail, useStore } from "../hooks";
import { describeError } from "../state/StoreContext";
import { storeRoutes } from "../navigation";
import { formatPrice } from "../utils/pricing";

export function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { services, notifyOrdersChanged } = useStore();
  const { order, isLoading, error, notFound, reload, setOrder } = useOrderDetail(id);
  const [cancelling, setCancelling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (isLoading && !order) {
    return (
      <StoreScreenShell title="Sipariş Detayı" testID="order-detail">
        <View style={styles.centered} testID="order-loading">
          <DumbbellSpinner color={colors.primary} size="large" />
        </View>
      </StoreScreenShell>
    );
  }

  if (notFound) {
    return (
      <StoreScreenShell title="Sipariş">
        <EmptyState icon="alert-circle-outline" title="Sipariş bulunamadı" message="Bu sipariş mevcut değil veya sana ait değil." actionLabel="Siparişlerim" onAction={() => router.replace(storeRoutes.orders())} testID="order-not-found" />
      </StoreScreenShell>
    );
  }

  if (error || !order) {
    return (
      <StoreScreenShell title="Sipariş Detayı">
        <EmptyState icon="cloud-offline-outline" title="Sipariş yüklenemedi" message={error ?? undefined} actionLabel="Tekrar dene" onAction={reload} testID="order-error" />
      </StoreScreenShell>
    );
  }

  const cancelled = order.status === "cancelled";
  const currentStep = ORDER_STATUS_STEPS.indexOf(order.status);

  const doCancel = async () => {
    setCancelling(true);
    setNotice(null);
    try {
      const updated = await services.orders.cancel(order.id);
      setOrder(updated);
      notifyOrdersChanged();
    } catch (e) {
      const info = describeError(e, "Sipariş iptal edilemedi. Lütfen tekrar dene.");
      setNotice(info.message);
      // Durum baska yerde degismis olabilir (orn. hazirlaniyor): guncel hali goster.
      if (info.status === 409) reload();
    } finally {
      setCancelling(false);
    }
  };

  const confirmCancel = () =>
    Alert.alert("Siparişi iptal et", `${order.orderNumber} numaralı sipariş iptal edilsin mi?`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "İptal et", style: "destructive", onPress: () => void doCancel() },
    ]);

  return (
    <StoreScreenShell title="Sipariş Detayı" subtitle={order.orderNumber} testID="order-detail">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={reload} tintColor={colors.primary} />}
      >
        {notice ? (
          <View style={[styles.banner, { backgroundColor: colors.dangerBackground }]} testID="order-notice" accessibilityLiveRegion="polite">
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={[styles.bannerText, { color: colors.danger }]}>{notice}</Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.title, { color: colors.text }]}>Durum</Text>
            <StatusPill status={order.status} />
          </View>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>Sipariş tarihi: {formatDate(order.createdAt)}</Text>
          {cancelled ? (
            <Text style={[styles.meta, { color: colors.danger }]} testID="order-cancelled">
              Sipariş iptal edildi{order.cancelReason ? `: ${order.cancelReason}` : "."}
            </Text>
          ) : (
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
          )}
        </View>

        <Text style={[styles.heading, { color: colors.text }]}>Ödeme</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.itemName, { color: colors.text }]}>{PAYMENT_LABELS[order.paymentMethod]}</Text>
            <Text style={[styles.meta, { color: order.paymentStatus === "failed" ? colors.danger : colors.textSecondary }]} testID="order-payment-status">
              {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </Text>
          </View>
        </View>
        {order.bankTransfer ? <BankTransferCard info={order.bankTransfer} total={order.total} /> : null}

        <Text style={[styles.heading, { color: colors.text }]}>Ürünler</Text>
        {order.items.map((item, index) => (
          <View key={`${item.productId ?? "x"}-${item.variantLabel}-${index}`} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ProductImage uri={item.image} style={styles.thumb} iconSize={20} />
            <View style={styles.itemText}>
              <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                {item.name}
              </Text>
              {item.variantLabel ? <Text style={[styles.meta, { color: colors.textSecondary }]}>{item.variantLabel}</Text> : null}
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {item.quantity} adet × {formatPrice(item.unitPrice)}
              </Text>
            </View>
            <Text style={[styles.itemName, { color: colors.text }]}>{formatPrice(item.lineTotal)}</Text>
          </View>
        ))}

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

        <OrderSummary subtotal={order.subtotal} discount={order.discount} shippingCost={order.shippingCost} total={order.total} />

        {order.history.length > 0 ? (
          <>
            <Text style={[styles.heading, { color: colors.text }]}>Geçmiş</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="order-history">
              {order.history.map((h, i) => (
                <View key={`${h.createdAt}-${i}`} style={styles.historyRow}>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {ORDER_STATUS_LABELS[h.status]} · {PAYMENT_STATUS_LABELS[h.paymentStatus]}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {formatDate(h.createdAt)}
                    {h.note ? ` · ${h.note}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {order.canCancel ? (
          <Pressable
            onPress={confirmCancel}
            disabled={cancelling}
            accessibilityRole="button"
            accessibilityState={{ disabled: cancelling, busy: cancelling }}
            testID="order-cancel"
            style={[styles.cancel, { borderColor: colors.danger, opacity: cancelling ? 0.6 : 1 }]}
          >
            {cancelling ? <DumbbellSpinner color={colors.danger} /> : <Text style={[styles.cancelLabel, { color: colors.danger }]}>Siparişi İptal Et</Text>}
          </Pressable>
        ) : null}
      </ScrollView>
    </StoreScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingBottom: 40, gap: 12 },
  centered: { flex: 1, minHeight: 240, alignItems: "center", justifyContent: "center" },
  banner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12 },
  bannerText: { flex: 1, fontSize: 13, fontWeight: "600" },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 15, fontWeight: "700" },
  meta: { fontSize: 12, lineHeight: 17 },
  steps: { flexDirection: "row", gap: 6, marginTop: 10 },
  step: { flex: 1, alignItems: "center", gap: 4 },
  stepLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  heading: { fontSize: 15, fontWeight: "700", marginTop: 8 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  itemText: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: "600" },
  historyRow: { gap: 2, paddingVertical: 4 },
  cancel: { height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 8 },
  cancelLabel: { fontSize: 14, fontWeight: "700" },
});
