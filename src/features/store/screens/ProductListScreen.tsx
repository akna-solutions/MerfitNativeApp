import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { EmptyState } from "../components/EmptyState";
import { DEFAULT_FILTERS, FilterSheet, FilterState, PRICE_RANGES } from "../components/FilterSheet";
import { CartButton } from "../components/HeaderButtons";
import { ProductCard } from "../components/ProductCard";
import { SearchBar } from "../components/SearchBar";
import { GUTTER } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { useProductList, useStore } from "../hooks";
import { ProductListParams } from "../navigation";
import { CollectionKey, Product, SortKey } from "../types";
import { COLLECTION_TITLES, SORT_LABELS } from "../utils/catalog";

const keyOf = (p: Product) => p.id;

/** Kategori listesi, arama sonuclari, koleksiyon ve kampanya listelerinin ortak ekrani (filtre + siralama). */
export function ProductListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams() as Partial<Record<keyof ProductListParams, string>>;
  const { categories, campaigns, products, isLoading, error, reload } = useStore();

  const [query, setQuery] = useState(params.q ?? "");
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS, sort: (params.sort as SortKey | undefined) ?? "featured" });
  const [categoryId, setCategoryId] = useState<string | undefined>(params.categoryId);
  const [sheetOpen, setSheetOpen] = useState(false);

  const collection = params.collection as CollectionKey | undefined;
  const campaign = campaigns.find((c) => c.id === params.campaignId);
  const range = PRICE_RANGES.find((r) => r.id === filters.priceRange);
  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))).sort(), [products]);

  const all = useProductList({
    query: query.trim(),
    categoryId,
    collection,
    inStockOnly: filters.inStockOnly,
    discountedOnly: filters.discountedOnly,
    brands: filters.brands,
    minPrice: range?.min,
    maxPrice: range?.max,
    sort: filters.sort,
  });
  const list = useMemo(() => (campaign ? all.filter((p) => campaign.productIds.includes(p.id)) : all), [all, campaign]);

  const category = categories.find((c) => c.id === categoryId);
  const title = params.title ?? category?.name ?? (collection ? COLLECTION_TITLES[collection] : params.q ? "Arama sonuçları" : "Tüm Ürünler");
  const activeFilterCount =
    (filters.inStockOnly ? 1 : 0) + (filters.discountedOnly ? 1 : 0) + filters.brands.length + (filters.priceRange !== "all" ? 1 : 0);

  const header = (
    <View style={styles.listHeader}>
      <View style={styles.searchRow}>
        <SearchBar value={query} onChangeText={setQuery} testID="list-search" />
      </View>
      {!campaign ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <CategoryChip label="Tümü" selected={!categoryId} onPress={() => setCategoryId(undefined)} testID="chip-all" />
          {categories.map((c) => (
            <CategoryChip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} testID={`chip-${c.id}`} />
          ))}
        </ScrollView>
      ) : null}
      <View style={styles.toolbar}>
        <Text style={[styles.count, { color: colors.textSecondary }]} testID="list-count">
          {list.length} ürün · {SORT_LABELS[filters.sort]}
        </Text>
        <Pressable
          testID="open-filters"
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={activeFilterCount > 0 ? `Filtrele ve sırala, ${activeFilterCount} filtre aktif` : "Filtrele ve sırala"}
          style={[styles.filterButton, { borderColor: activeFilterCount ? colors.primary : colors.border, backgroundColor: colors.inputBackground }]}
        >
          <Ionicons name="options-outline" size={16} color={colors.text} />
          <Text style={[styles.filterLabel, { color: colors.text }]}>Filtre{activeFilterCount ? ` (${activeFilterCount})` : ""}</Text>
        </Pressable>
      </View>
    </View>
  );

  let content: React.ReactNode;
  if (isLoading) {
    content = <EmptyState icon="hourglass-outline" title="Ürünler yükleniyor" />;
  } else if (error) {
    content = <EmptyState icon="cloud-offline-outline" title="Ürünler yüklenemedi" message={error} actionLabel="Tekrar dene" onAction={reload} />;
  } else {
    content = (
      <FlatList
        testID="product-list"
        data={list}
        keyExtractor={keyOf}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ProductCard product={item} />
          </View>
        )}
        columnWrapperStyle={styles.column}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="Ürün bulunamadı"
            message="Arama veya filtrelerinize uyan ürün yok."
            actionLabel="Filtreleri temizle"
            onAction={() => {
              setQuery("");
              setCategoryId(undefined);
              setFilters(DEFAULT_FILTERS);
            }}
            testID="list-empty"
          />
        }
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
      />
    );
  }

  return (
    <StoreScreenShell title={title} subtitle={campaign?.description} right={<CartButton />} onBack={() => (router.canGoBack() ? router.back() : router.replace("/pages/store" as never))}>
      {content}
      <FilterSheet
        visible={sheetOpen}
        initial={filters}
        brands={brands}
        onApply={(next) => {
          setFilters(next);
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </StoreScreenShell>
  );
}

function CategoryChip({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.inputBackground }]}
    >
      <Text style={[styles.chipLabel, { color: selected ? "#FFFFFF" : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: GUTTER, paddingBottom: 32 },
  listHeader: { gap: 12, marginBottom: 14 },
  searchRow: { flexDirection: "row" },
  chipRow: { gap: 8 },
  chip: { paddingHorizontal: 14, height: 34, borderRadius: 17, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  chipLabel: { fontSize: 13, fontWeight: "600" },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  count: { fontSize: 12, flex: 1 },
  filterButton: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1 },
  filterLabel: { fontSize: 13, fontWeight: "600" },
  column: { gap: 12 },
  cell: { flex: 1, marginBottom: 12, maxWidth: "50%" },
});
