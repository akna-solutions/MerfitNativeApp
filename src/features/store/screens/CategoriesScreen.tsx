import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DumbbellSpinner } from "../../../shared/motion/DumbbellSpinner";
import { SafeAreaView } from "react-native-safe-area-context";

import { useNavigationGuard } from "../../../shared/navigation/useNavigationGuard";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { EmptyState } from "../components/EmptyState";
import { CartButton } from "../components/HeaderButtons";
import { ProductImage } from "../components/ProductImage";
import { CAMPAIGN_CARD_WIDTH, CampaignCard, GUTTER, SectionHeader } from "../components/StoreSections";
import { useStore } from "../hooks";
import { storeRoutes } from "../navigation";
import { Campaign, Category, Product } from "../types";

/** Alt navbar (yuzen kapsul) icerigin ustune bindigi icin diger tab ekranlariyla ayni alt bosluk. */
const NAVBAR_CLEARANCE = 156;

/** MB Shop navbar'indaki "Kategoriler" sekmesi: ustte kampanyalar, altta secilebilir kategori listesi (urun yok). */
export function CategoriesScreen() {
  const router = useRouter();
  const guard = useNavigationGuard();
  const { colors } = useTheme();
  const { isLoading, error, reload, categories, campaigns, products, productsById } = useStore();

  const countByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1);
    return map;
  }, [products]);

  const featuredProductByCampaign = useMemo(() => {
    const map = new Map<string, Product | undefined>();
    for (const c of campaigns) {
      const items = c.productIds.map((id) => productsById.get(id)).filter((p): p is Product => Boolean(p));
      map.set(c.id, items.sort((a, b) => b.discountPercentage - a.discountPercentage)[0]);
    }
    return map;
  }, [campaigns, productsById]);

  const openCampaign = guard((campaign: Campaign) => router.push(storeRoutes.list({ campaignId: campaign.id, title: campaign.title })));
  const openCategory = guard((category: Category) => router.push(storeRoutes.list({ categoryId: category.id, title: category.name })));

  let body: React.ReactNode;
  if (isLoading) {
    body = (
      <View style={styles.centered} testID="categories-loading">
        <DumbbellSpinner color={colors.primary} size="large" />
      </View>
    );
  } else if (error) {
    body = <EmptyState icon="cloud-offline-outline" title="MB Shop yüklenemedi" message={error} actionLabel="Tekrar dene" onAction={reload} testID="categories-error" />;
  } else {
    body = (
      <>
        {campaigns.length > 0 ? (
          <>
            <SectionHeader title="Kampanyalar" />
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
              testID="categories-campaigns"
            />
          </>
        ) : null}

        <View style={campaigns.length > 0 ? styles.section : undefined}>
          <SectionHeader title="Tüm Kategoriler" />
          <View style={[styles.padded, styles.list]}>
            {categories.map((category) => {
              const count = countByCategory.get(category.id) ?? 0;
              return (
                <Pressable
                  key={category.id}
                  testID={`category-row-${category.id}`}
                  onPress={() => openCategory(category)}
                  accessibilityRole="button"
                  accessibilityLabel={`${category.name}, ${count} ürün`}
                  style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <ProductImage uri={category.image} icon={category.icon} style={styles.rowImage} iconSize={24} />
                  <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                      {category.name}
                    </Text>
                    <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>{count} ürün</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.icon} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID="categories-screen">
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView style={styles.flex} contentContainerStyle={{ paddingTop: 16, paddingBottom: NAVBAR_CLEARANCE }} showsVerticalScrollIndicator={false}>
          <View style={[styles.header, styles.padded]}>
            <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
              Kategoriler
            </Text>
            <CartButton />
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800" },
  section: { marginTop: 28 },
  rowContent: { paddingHorizontal: GUTTER },
  gap: { width: 12 },
  centered: { minHeight: 280, alignItems: "center", justifyContent: "center" },
  list: { gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 12, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  rowImage: { width: 52, height: 52, borderRadius: 14 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "700" },
  rowMeta: { fontSize: 12, marginTop: 2 },
});
