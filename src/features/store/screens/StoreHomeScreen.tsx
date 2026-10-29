import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DumbbellSpinner } from "../../../shared/motion/DumbbellSpinner";
import { SafeAreaView } from "react-native-safe-area-context";

import { useNavigationGuard } from "../../../shared/navigation/useNavigationGuard";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { CartButton, FavoritesButton } from "../components/HeaderButtons";
import { EmptyState } from "../components/EmptyState";
import { ProductCard } from "../components/ProductCard";
import { SearchBar } from "../components/SearchBar";
import { CAMPAIGN_CARD_WIDTH, CampaignCard, CategoryTile, GUTTER, ProductRow, SectionHeader } from "../components/StoreSections";
import { useDebouncedValue, useProductQuery, useStore } from "../hooks";
import { storeRoutes } from "../navigation";
import { Campaign, CollectionKey } from "../types";
import { COLLECTION_TITLES } from "../utils/catalog";

/** Alt navbar (yuzen kapsul) icerigin ustune bindigi icin diger tab ekranlariyla ayni alt bosluk. */
const NAVBAR_CLEARANCE = 156;
const COLLECTIONS: CollectionKey[] = ["bestsellers", "discounted", "featured", "new"];
const ROW_LIMIT = 8;
const SEARCH_PAGE_SIZE = 20;

export function StoreHomeScreen() {
  const router = useRouter();
  const guard = useNavigationGuard();
  const { colors } = useTheme();
  const { isLoading, error, reload, categories: allCategories, campaigns } = useStore();
  const categories = useMemo(() => allCategories.filter((c) => !c.parentId), [allCategories]);
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const searching = trimmed.length > 0;
  // Arama sunucuda yapilir; her tus vurusunda istek atilmasin diye kisa bir gecikmeyle gonderilir.
  const debounced = useDebouncedValue(trimmed);
  const results = useProductQuery({ query: debounced }, { pageSize: SEARCH_PAGE_SIZE, enabled: debounced.length > 0 });
  const searchPending = searching && (debounced !== trimmed || results.isLoading);

  const openCampaign = guard((campaign: Campaign) => {
    router.push(storeRoutes.list({ campaignId: campaign.id, title: campaign.title }));
  });

  let body: React.ReactNode;
  if (isLoading) {
    body = (
      <View style={styles.centered} testID="store-loading">
        <DumbbellSpinner color={colors.primary} size="large" />
      </View>
    );
  } else if (error) {
    body = <EmptyState icon="cloud-offline-outline" title="MB Shop yüklenemedi" message={error} actionLabel="Tekrar dene" onAction={reload} testID="store-error" />;
  } else if (searching) {
    body = (
      <View style={styles.padded}>
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]} testID="search-count">
            {searchPending ? `“${trimmed}” aranıyor…` : `“${trimmed}” için ${results.totalCount} sonuç`}
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
        {searchPending && results.items.length === 0 ? (
          <View style={styles.centered} testID="search-loading">
            <DumbbellSpinner color={colors.primary} size="large" />
          </View>
        ) : results.error ? (
          <EmptyState icon="cloud-offline-outline" title="Arama yapılamadı" message={results.error} actionLabel="Tekrar dene" onAction={results.reload} testID="search-error" />
        ) : results.items.length === 0 ? (
          <EmptyState icon="search-outline" title="Ürün bulunamadı" message="Farklı bir ürün adı, marka veya SKU deneyin." actionLabel="Aramayı temizle" onAction={() => setQuery("")} testID="search-empty" />
        ) : (
          <>
            <View style={styles.grid}>
              {results.items.map((p) => (
                <View key={p.id} style={styles.gridCell}>
                  <ProductCard product={p} />
                </View>
              ))}
            </View>
            {results.hasNextPage ? (
              <Pressable
                onPress={guard(() => router.push(storeRoutes.list({ q: trimmed })))}
                accessibilityRole="button"
                testID="search-see-all"
                style={[styles.seeAll, { borderColor: colors.border }]}
              >
                <Text style={[styles.filterLabel, { color: colors.text }]}>Tüm {results.totalCount} sonucu gör</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    );
  } else {
    body = (
      <>
        {campaigns.length > 0 ? (
          <>
            <SectionHeader title="İndirimler ve Kampanyalar" />
            <FlatList
              horizontal
              data={campaigns}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => <CampaignCard campaign={item} onPress={() => openCampaign(item)} />}
              showsHorizontalScrollIndicator={false}
              snapToInterval={CAMPAIGN_CARD_WIDTH + 12}
              decelerationRate="fast"
              contentContainerStyle={styles.rowContent}
              ItemSeparatorComponent={Gap}
              testID="campaign-list"
            />
          </>
        ) : null}

        <View style={campaigns.length > 0 ? styles.section : undefined}>
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

        {categories.length === 0 && campaigns.length === 0 ? (
          <EmptyState icon="storefront-outline" title="Mağaza henüz hazırlanıyor" message="Ürünler eklendiğinde burada listelenecek." testID="store-empty" />
        ) : (
          COLLECTIONS.map((key) => <CollectionSection key={key} collection={key} onSeeAll={guard(() => router.push(storeRoutes.list({ collection: key, title: COLLECTION_TITLES[key] })))} />)
        )}
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

/** Ana sayfadaki koleksiyon seridi: kendi istegini yapar; bos koleksiyon gizlenir. */
function CollectionSection({ collection, onSeeAll }: { collection: CollectionKey; onSeeAll: () => void }) {
  const query = useProductQuery({ collection }, { pageSize: ROW_LIMIT });
  if (!query.isLoading && !query.error && query.items.length === 0) return null;
  return (
    <View style={styles.section} testID={`collection-${collection}`}>
      <SectionHeader title={COLLECTION_TITLES[collection]} actionLabel={query.items.length > 0 ? "Tümünü gör" : undefined} onAction={onSeeAll} />
      <ProductRow products={query.items} isLoading={query.isLoading} error={query.error} onRetry={query.reload} testID={`row-${collection}`} />
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
  seeAll: { marginTop: 14, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
