import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { DumbbellSpinner } from "../../../shared/motion/DumbbellSpinner";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { CartButton } from "../components/HeaderButtons";
import { EmptyState } from "../components/EmptyState";
import { ProductCard } from "../components/ProductCard";
import { GUTTER } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { useFavoriteProducts } from "../hooks";
import { storeRoutes } from "../navigation";
import { ProductSummary } from "../types";

export function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { products: favorites, isLoading, error, reload } = useFavoriteProducts();

  return (
    <StoreScreenShell title="Favorilerim" subtitle={favorites.length > 0 ? `${favorites.length} ürün` : undefined} right={<CartButton />} testID="favorites-screen">
      <FlatList
        data={favorites}
        keyExtractor={(p: ProductSummary) => p.id}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ProductCard product={item} />
          </View>
        )}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centered} testID="favorites-loading">
              <DumbbellSpinner color={colors.primary} size="large" />
            </View>
          ) : error ? (
            <EmptyState icon="cloud-offline-outline" title="Favoriler yüklenemedi" message={error} actionLabel="Tekrar dene" onAction={reload} testID="favorites-error" />
          ) : (
          <EmptyState
            icon="heart-outline"
            title="Favori listen boş"
            message="Beğendiğin ürünlerdeki kalp simgesine dokunarak buraya ekleyebilirsin."
            actionLabel="MB Shop'a git"
            onAction={() => router.replace(storeRoutes.home())}
            testID="favorites-empty"
          />
          )
        }
        showsVerticalScrollIndicator={false}
      />
      {favorites.length > 0 ? (
        <Pressable onPress={() => router.replace(storeRoutes.home())} accessibilityRole="button" style={styles.moreWrap}>
          <Ionicons name="storefront-outline" size={16} color={colors.primary} />
          <Text style={[styles.more, { color: colors.primary }]}>Alışverişe devam et</Text>
        </Pressable>
      ) : null}
    </StoreScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingBottom: 16, flexGrow: 1 },
  column: { gap: 12 },
  centered: { flex: 1, minHeight: 240, alignItems: "center", justifyContent: "center" },
  cell: { flex: 1, marginBottom: 12, maxWidth: "50%" },
  moreWrap: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  more: { fontSize: 14, fontWeight: "700" },
});
