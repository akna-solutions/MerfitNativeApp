import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useNavigationGuard } from "../../../shared/navigation/useNavigationGuard";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { useCart, useFavorites } from "../hooks";
import { storeRoutes } from "../navigation";

function Badge({ count, testID }: { count: number; testID: string }) {
  const { colors } = useTheme();
  if (count <= 0) return null;
  return (
    <View style={[styles.badge, { backgroundColor: colors.primary }]} testID={testID}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

export function CartButton() {
  const router = useRouter();
  const guard = useNavigationGuard();
  const { colors } = useTheme();
  const { totals } = useCart();
  return (
    <Pressable
      testID="cart-button"
      onPress={guard(() => router.push(storeRoutes.cart()))}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={totals.itemCount > 0 ? `Sepet, ${totals.itemCount} ürün` : "Sepet"}
      style={[styles.button, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
    >
      <Ionicons name="cart-outline" size={20} color={colors.text} />
      <Badge count={totals.itemCount} testID="cart-badge" />
    </Pressable>
  );
}

export function FavoritesButton() {
  const router = useRouter();
  const guard = useNavigationGuard();
  const { colors } = useTheme();
  const { favoriteIds } = useFavorites();
  return (
    <Pressable
      testID="favorites-button"
      onPress={guard(() => router.push(storeRoutes.favorites()))}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={favoriteIds.length > 0 ? `Favoriler, ${favoriteIds.length} ürün` : "Favoriler"}
      style={[styles.button, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
    >
      <Ionicons name="heart-outline" size={20} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  badge: { position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
});
