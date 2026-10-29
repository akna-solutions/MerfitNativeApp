import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useNavigationGuard } from "../../../shared/navigation/useNavigationGuard";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { CartButton, FavoritesButton } from "../components/HeaderButtons";
import { EmptyState } from "../components/EmptyState";
import { ProductCard } from "../components/ProductCard";
import { SearchBar } from "../components/SearchBar";
import { CAMPAIGN_CARD_WIDTH, CampaignCard, CategoryTile, GUTTER, ProductRow, SectionHeader } from "../components/StoreSections";
import { useProductList, useStore } from "../hooks";
import { storeRoutes } from "../navigation";
import { Campaign, CollectionKey, Product } from "../types";
import { COLLECTION_TITLES } from "../utils/catalog";

/** Alt navbar (yuzen kapsul) icerigin ustune bindigi icin diger tab ekranlariyla ayni alt bosluk. */
const NAVBAR_CLEARANCE = 156;
const COLLECTIONS: CollectionKey[] = ["bestsellers", "discounted", "forYou", "new"];
const ROW_LIMIT = 8;

export function StoreHomeScreen() {
  const router = useRouter();
  const guard = useNavigationGuard();
  const { colors } = useTheme();
  const { isLoading, error, reload, categories, campaigns, productsById } = useStore();
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const searching = trimmed.length > 0;

  const results = useProductList({ query: trimmed });
  const bestsellers = useProductList({ collection: "bestsellers", sort: "rating" });
  const discounted = useProductList({ collection: "discounted", sort: "discount" });
  const forYou = useProductList({ collection: "forYou" });
  const fresh = useProductList({ collection: "new", sort: "newest" });
  const byCollection: Record<CollectionKey, Product[]> = { bestsellers, discounted, forYou, new: fresh };

  const featuredProductByCampaign = useMemo(() => {
    const map = new Map<string, Product | undefined>();
    for (const c of campaigns) {
      const items = c.productIds.map((id) => productsById.get(id)).filter((p): p is Product => Boolean(p));
      map.set(c.id, items.sort((a, b) => b.discountPercentage - a.discountPercentage)[0]);
    }
    return map;
  }, [campaigns, productsById]);

  const openCampaign = guard((campaign: Campaign) => {
    router.push(storeRoutes.list({ campaignId: campaign.id, title: campaign.title }));
  });

  let body: React.ReactNode;
  if (isLoading) {
    body = (
      <View style={styles.centered} testID="store-loading">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  } else if (error) {
    body = <EmptyState icon="cloud-offline-outline" title="MB Shop yüklenemedi" message={error} actionLabel="Tekrar dene" onAction={reload} testID="store-error" />;
  } else if (searching) {
    body = (
      <View style={styles.padded}>
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]} testID="search-count">
            “{trimmed}” için {results.length} sonuç
          </Text>
          <Pressable
            onPress={guard(() => router.push(storeRoutes.list({ q: trimmed })))}
            accessibilityRole="button"
            accessibilityLabel="Filtrele ve sırala"
            style={[styles.filterButton, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
          >
            <Ionicons name="options-outline" size={16} color={colors.text} />
            <Text style={[styles.filterLabel, { color: colors.text }]}>Filtrele ve sırala</Text>
          </Pressable>
        </View>
        {results.length === 0 ? (
          <EmptyState icon="search-outline" title="Ürün bulunamadı" message="Farklı bir ürün adı veya marka deneyin." actionLabel="Aramayı temizle" onAction={() => setQuery("")} testID="search-empty" />
        ) : (
          <View style={styles.grid}>
            {results.map((p) => (
              <View key={p.id} style={styles.gridCell}>
                <ProductCard product={p} />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  } else {
    body = (
      <>
        <SectionHeader title="İndirimler ve Kampanyalar" />
        <FlatList
          horizontal
          data={campaigns}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <CampaignCard campaign={item} product={featuredProductByCampaign.get(item.id)} onPress={() => openCampaign(item)} />}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CAMPAIGN_CARD_WIDTH + 12}
          decelerationRate="fast"
          contentContainerStyle={styles.rowContent}
          ItemSeparatorComponent={Gap}
          testID="campaign-list"
        />

        <View style={styles.section}>
          <SectionHeader title="Kategoriler" />
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => <CategoryTile category={item} onPress={guard(() => router.push(storeRoutes.list({ categoryId: item.id, title: item.name })))} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rowContent}
            ItemSeparatorComponent={Gap}
            testID="category-list"
          />
        </View>

        {COLLECTIONS.map((key) => (
          <View key={key} style={styles.section}>
            <SectionHeader title={COLLECTION_TITLES[key]} actionLabel="Tümünü gör" onAction={guard(() => router.push(storeRoutes.list({ collection: key, title: COLLECTION_TITLES[key] })))} />
            <ProductRow products={byCollection[key].slice(0, ROW_LIMIT)} />
          </View>
        ))}
      </>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID="store-home">
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: NAVBAR_CLEARANCE }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, styles.padded]}>
            <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
              MB Shop
            </Text>
            <View style={styles.actions}>
              <FavoritesButton />
              <CartButton />
            </View>
          </View>
          <View style={[styles.padded, styles.searchRow]}>
            <SearchBar value={query} onChangeText={setQuery} />
          </View>
          {body}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Gap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  padded: { paddingHorizontal: GUTTER },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 26, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 10 },
  searchRow: { flexDirection: "row", marginTop: 14, marginBottom: 20 },
  section: { marginTop: 28 },
  rowContent: { paddingHorizontal: GUTTER },
  gap: { width: 12 },
  centered: { minHeight: 280, alignItems: "center", justifyContent: "center" },
  resultsHeader: { gap: 10, marginBottom: 14 },
  resultsCount: { fontSize: 13 },
  filterButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  filterLabel: { fontSize: 13, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridCell: { width: "47.5%", flexGrow: 1 },
});
