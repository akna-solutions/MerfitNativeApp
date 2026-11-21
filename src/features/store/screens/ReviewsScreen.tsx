import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { EmptyState } from "../components/EmptyState";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { ReviewSummaryCard } from "../components/reviews/ReviewSummaryCard";
import { useReviewActions } from "../components/reviews/useReviewActions";
import { GUTTER } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { useReviewList, useReviewSummary } from "../hooks";
import { storeRoutes } from "../navigation";
import { ReviewFilters, ReviewSort } from "../types";

export const REVIEW_SORT_LABELS: Record<ReviewSort, string> = {
  newest: "En yeni",
  oldest: "En eski",
  rating_desc: "En yüksek puan",
  rating_asc: "En düşük puan",
  helpful: "En faydalı",
};

function Chip({ label, selected, onPress, testID, icon }: { label: string; selected: boolean; onPress: () => void; testID: string; icon?: "star" | "image-outline" | "checkmark-circle-outline" }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.card }]}
    >
      {icon ? <Ionicons name={icon} size={13} color={selected ? "#FFFFFF" : colors.primary} /> : null}
      <Text style={[styles.chipLabel, { color: selected ? "#FFFFFF" : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Urunun tum yorumlari: siralama, puan/fotografli/onayli filtreleri ve sonsuz kaydirma. */
export function ReviewsScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const id = typeof productId === "string" ? productId : undefined;
  const router = useRouter();
  const { colors } = useTheme();
  const [filters, setFilters] = useState<ReviewFilters>({ sort: "newest" });
  const { summary } = useReviewSummary(id);
  const list = useReviewList(id, filters, 10);
  const [notice, setNotice] = useState<{ message: string; error?: boolean } | null>(null);
  const onNotice = useCallback((message: string, isError?: boolean) => setNotice({ message, error: isError }), []);
  const { cardProps, modals } = useReviewActions(id ?? "", onNotice);

  const toggleRating = (rating: number) => setFilters((f) => ({ ...f, rating: f.rating === rating ? undefined : rating }));
  const anyFilter = Boolean(filters.rating || filters.withPhotos || filters.verifiedOnly);

  const header = (
    <View style={styles.header}>
      {summary && summary.reviewCount > 0 ? <ReviewSummaryCard summary={summary} onSelectRating={toggleRating} selectedRating={filters.rating} /> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} testID="review-sorts">
        {(Object.keys(REVIEW_SORT_LABELS) as ReviewSort[]).map((key) => (
          <Chip key={key} testID={`review-sort-${key}`} label={REVIEW_SORT_LABELS[key]} selected={filters.sort === key} onPress={() => setFilters((f) => ({ ...f, sort: key }))} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} testID="review-filters">
        {[5, 4, 3, 2, 1].map((n) => (
          <Chip key={n} testID={`review-filter-rating-${n}`} icon="star" label={String(n)} selected={filters.rating === n} onPress={() => toggleRating(n)} />
        ))}
        <Chip
          testID="review-filter-photos"
          icon="image-outline"
          label={summary ? `Fotoğraflı (${summary.withPhotosCount})` : "Fotoğraflı"}
          selected={Boolean(filters.withPhotos)}
          onPress={() => setFilters((f) => ({ ...f, withPhotos: !f.withPhotos }))}
        />
        <Chip
          testID="review-filter-verified"
          icon="checkmark-circle-outline"
          label={summary ? `Onaylı alışveriş (${summary.verifiedPurchaseCount})` : "Onaylı alışveriş"}
          selected={Boolean(filters.verifiedOnly)}
          onPress={() => setFilters((f) => ({ ...f, verifiedOnly: !f.verifiedOnly }))}
        />
      </ScrollView>
      {notice ? (
        <Text style={[styles.notice, { color: notice.error ? colors.danger : colors.primary }]} testID="reviews-notice">
          {notice.message}
        </Text>
      ) : null}
    </View>
  );

  const hasMine = Boolean(summary?.myReviewId);
  const footer = id ? (
    <Pressable onPress={() => router.push(storeRoutes.writeReview(id))} accessibilityRole="button" testID="reviews-write" style={[styles.cta, { backgroundColor: colors.primary }]}>
      <Ionicons name={hasMine ? "create-outline" : "star-outline"} size={17} color="#FFFFFF" />
      <Text style={styles.ctaLabel}>{hasMine ? "Yorumunu düzenle" : "Yorum yaz"}</Text>
    </Pressable>
  ) : undefined;

  return (
    <StoreScreenShell title="Değerlendirmeler" subtitle={summary ? `${summary.reviewCount} değerlendirme` : undefined} footer={footer} testID="reviews-screen">
      <FlatList
        testID="reviews-list"
        data={list.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewCard review={item} {...cardProps} />}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.content}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        refreshing={list.isLoading && list.items.length > 0}
        onRefresh={list.reload}
        ListEmptyComponent={
          list.isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : list.error ? (
            <EmptyState icon="cloud-offline-outline" title="Yorumlar yüklenemedi" message={list.error} actionLabel="Tekrar dene" onAction={list.reload} testID="reviews-list-error" />
          ) : anyFilter ? (
            <EmptyState icon="filter-outline" title="Bu filtreye uyan yorum yok" actionLabel="Filtreleri temizle" onAction={() => setFilters((f) => ({ sort: f.sort }))} testID="reviews-filter-empty" />
          ) : (
            <EmptyState icon="chatbubbles-outline" title="Henüz değerlendirme yok" message="Bu ürünü ilk sen değerlendir." testID="reviews-list-empty" />
          )
        }
        ListFooterComponent={
          list.isLoadingMore ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : list.error && list.items.length > 0 ? (
            <Pressable onPress={list.loadMore} accessibilityRole="button" style={styles.retry}>
              <Text style={[styles.notice, { color: colors.danger }]}>{list.error} Tekrar denemek için dokun.</Text>
            </Pressable>
          ) : undefined
        }
      />
      {modals}
    </StoreScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingBottom: 24 },
  header: { gap: 12, paddingBottom: 14 },
  chips: { gap: 8, paddingRight: GUTTER },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1 },
  chipLabel: { fontSize: 13, fontWeight: "600" },
  separator: { height: 10 },
  loader: { marginVertical: 24 },
  notice: { fontSize: 13, fontWeight: "600" },
  retry: { paddingVertical: 16 },
  cta: { height: 48, borderRadius: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ctaLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
