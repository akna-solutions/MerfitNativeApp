import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { DumbbellSpinner } from "../../../shared/motion/DumbbellSpinner";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { EmptyState } from "../components/EmptyState";
import { GUTTER } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, formatDate } from "../components/labels";
import { StatusPill } from "../components/StatusPill";
import { useOrderList } from "../hooks";
import { storeRoutes } from "../navigation";
import { OrderListItem } from "../types";
import { formatPrice } from "../utils/pricing";

const OrderRow = memo(function OrderRow({ order, onPress }: { order: OrderListItem; onPress: (order: OrderListItem) => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={`order-${order.id}`}
      onPress={() => onPress(order)}
      accessibilityRole="button"
      accessibilityLabel={`Sipariş ${order.orderNumber}, ${ORDER_STATUS_LABELS[order.status]}, ${formatPrice(order.total)}`}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.top}>
        <Text style={[styles.id, { color: colors.text }]} numberOfLines={1}>
          {order.orderNumber}
        </Text>
        <StatusPill status={order.status} />
      </View>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {formatDate(order.createdAt)} · {order.itemCount} ürün
      </Text>
      <Text style={[styles.items, { color: colors.textSecondary }]} numberOfLines={1}>
        {order.itemNames.join(", ")}
      </Text>
      <View style={styles.bottom}>
        <Text style={[styles.eta, { color: order.paymentStatus === "failed" ? colors.danger : colors.textSecondary }]} numberOfLines={1} testID={`order-payment-${order.id}`}>
          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
        </Text>
        <Text style={[styles.total, { color: colors.text }]}>{formatPrice(order.total)}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.icon} />
      </View>
    </Pressable>
  );
});

type Props = {
  /** Store navbar'indaki "Siparişlerim" sekmesi olarak gosterilir (geri, Store ana sayfasina doner). */
  inTabs?: boolean;
};

export function OrdersScreen({ inTabs = false }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const result = useOrderList();
  const onOpen = useCallback((o: OrderListItem) => router.push(storeRoutes.order(o.id)), [router]);
  return (
    <StoreScreenShell
      title="Siparişlerim"
      subtitle={result.totalCount > 0 ? `${result.totalCount} sipariş` : undefined}
      testID="orders-screen"
      tabBarClearance={inTabs}
      onBack={inTabs ? () => router.navigate(storeRoutes.home()) : undefined}
    >
      <FlatList
        data={result.items}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OrderRow order={item} onPress={onOpen} />}
        ItemSeparatorComponent={Sep}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          result.isLoading ? (
            <View style={styles.centered} testID="orders-loading">
              <DumbbellSpinner color={colors.primary} size="large" />
            </View>
          ) : result.error ? (
            <EmptyState icon="cloud-offline-outline" title="Siparişler yüklenemedi" message={result.error} actionLabel="Tekrar dene" onAction={result.reload} testID="orders-error" />
          ) : (
            <EmptyState icon="receipt-outline" title="Henüz siparişin yok" message="Verdiğin siparişler burada listelenir." actionLabel="MB Shop'a git" onAction={() => router.replace(storeRoutes.home())} testID="orders-empty" />
          )
        }
        ListFooterComponent={
          result.isLoadingMore ? (
            <View style={styles.footer} testID="orders-loading-more">
              <DumbbellSpinner color={colors.primary} />
            </View>
          ) : result.error && result.items.length > 0 ? (
            <Pressable onPress={result.loadMore} accessibilityRole="button" style={styles.footer} testID="orders-load-more-retry">
              <Text style={[styles.retry, { color: colors.primary }]}>{result.error} Tekrar dene</Text>
            </Pressable>
          ) : undefined
        }
        onEndReached={result.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={false} onRefresh={result.reload} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
    </StoreScreenShell>
  );
}

function Sep() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingBottom: 32 },
  sep: { height: 12 },
  centered: { minHeight: 240, alignItems: "center", justifyContent: "center" },
  footer: { paddingVertical: 20, alignItems: "center" },
  retry: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 6 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  id: { fontSize: 14, fontWeight: "700", flexShrink: 1 },
  meta: { fontSize: 12 },
  items: { fontSize: 12 },
  bottom: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  eta: { flex: 1, fontSize: 12 },
  total: { fontSize: 15, fontWeight: "800" },
});
