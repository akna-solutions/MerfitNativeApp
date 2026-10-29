import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { EmptyState } from "../components/EmptyState";
import { GUTTER } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { ORDER_STATUS_LABELS, formatDate } from "../components/labels";
import { StatusPill } from "../components/StatusPill";
import { useOrders } from "../hooks";
import { storeRoutes } from "../navigation";
import { Order } from "../types";
import { formatPrice } from "../utils/pricing";

const OrderRow = memo(function OrderRow({ order, onPress }: { order: Order; onPress: (order: Order) => void }) {
  const { colors } = useTheme();
  const count = order.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <Pressable
      testID={`order-${order.id}`}
      onPress={() => onPress(order)}
      accessibilityRole="button"
      accessibilityLabel={`Sipariş ${order.id}, ${ORDER_STATUS_LABELS[order.status]}, ${formatPrice(order.total)}`}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.top}>
        <Text style={[styles.id, { color: colors.text }]} numberOfLines={1}>
          {order.id}
        </Text>
        <StatusPill status={order.status} />
      </View>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {formatDate(order.createdAt)} · {count} ürün
      </Text>
      <Text style={[styles.items, { color: colors.textSecondary }]} numberOfLines={1}>
        {order.items.map((i) => i.name).join(", ")}
      </Text>
      <View style={styles.bottom}>
        <Text style={[styles.eta, { color: colors.textSecondary }]} numberOfLines={1}>
          {order.estimatedDelivery}
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
  const { orders } = useOrders();
  return (
    <StoreScreenShell title="Siparişlerim" subtitle="Demo siparişler" testID="orders-screen" tabBarClearance={inTabs} onBack={inTabs ? () => router.navigate(storeRoutes.home()) : undefined}>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OrderRow order={item} onPress={(o) => router.push(storeRoutes.order(o.id))} />}
        ItemSeparatorComponent={Sep}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="Henüz siparişin yok" message="Verdiğin siparişler burada listelenir." actionLabel="Store'a git" onAction={() => router.replace(storeRoutes.home())} testID="orders-empty" />}
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
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 6 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  id: { fontSize: 14, fontWeight: "700", flexShrink: 1 },
  meta: { fontSize: 12 },
  items: { fontSize: 12 },
  bottom: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  eta: { flex: 1, fontSize: 12 },
  total: { fontSize: 15, fontWeight: "800" },
});
