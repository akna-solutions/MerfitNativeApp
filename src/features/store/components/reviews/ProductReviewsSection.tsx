import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { useReviewList, useReviewSummary } from "../../hooks";
import { storeRoutes } from "../../navigation";
import { ReviewCard } from "./ReviewCard";
import { ReviewSummaryCard } from "./ReviewSummaryCard";
import { useReviewActions } from "./useReviewActions";

const PREVIEW_FILTERS = { sort: "helpful" as const };
const PREVIEW_COUNT = 3;

/** Urun detayindaki degerlendirmeler bolumu: ozet, en faydali birkac yorum, "Yorum yaz" ve tumunu gor. */
export function ProductReviewsSection({ productId }: { productId: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { summary, isLoading, error, reload } = useReviewSummary(productId);
  const list = useReviewList(productId, PREVIEW_FILTERS, PREVIEW_COUNT);
  const [notice, setNotice] = useState<{ message: string; error?: boolean } | null>(null);
  const onNotice = useCallback((message: string, isError?: boolean) => setNotice({ message, error: isError }), []);
  const { cardProps, modals } = useReviewActions(productId, onNotice);

  const hasMine = Boolean(summary?.myReviewId);
  const count = summary?.reviewCount ?? 0;

  return (
    <View style={styles.wrap} testID="product-reviews">
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          Değerlendirmeler
        </Text>
        {count > 0 ? (
          <Pressable onPress={() => router.push(storeRoutes.reviews(productId))} hitSlop={8} accessibilityRole="button" testID="reviews-see-all">
            <Text style={[styles.link, { color: colors.primary }]}>Tümü ({count})</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading && !summary ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : error && !summary ? (
        <Pressable onPress={reload} accessibilityRole="button" style={[styles.empty, { borderColor: colors.border }]} testID="reviews-error">
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Değerlendirmeler yüklenemedi. Tekrar denemek için dokun.</Text>
        </Pressable>
      ) : summary && count > 0 ? (
        <ReviewSummaryCard summary={summary} />
      ) : (
        <View style={[styles.empty, { borderColor: colors.border }]} testID="reviews-empty">
          <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Henüz değerlendirme yok. Bu ürünü ilk sen değerlendir.</Text>
        </View>
      )}

      <Pressable
        onPress={() => router.push(storeRoutes.writeReview(productId))}
        accessibilityRole="button"
        testID="write-review"
        style={[styles.writeButton, { borderColor: colors.primary }]}
      >
        <Ionicons name={hasMine ? "create-outline" : "star-outline"} size={17} color={colors.primary} />
        <Text style={[styles.writeLabel, { color: colors.primary }]}>{hasMine ? "Yorumunu düzenle" : "Yorum yaz"}</Text>
      </Pressable>

      {notice ? (
        <Text style={[styles.notice, { color: notice.error ? colors.danger : colors.primary }]} testID="reviews-notice">
          {notice.message}
        </Text>
      ) : null}

      {list.items.slice(0, PREVIEW_COUNT).map((review) => (
        <ReviewCard key={review.id} review={review} {...cardProps} />
      ))}

      {count > PREVIEW_COUNT ? (
        <Pressable
          onPress={() => router.push(storeRoutes.reviews(productId))}
          accessibilityRole="button"
          style={[styles.allButton, { backgroundColor: colors.inputBackground }]}
          testID="reviews-see-all-bottom"
        >
          <Text style={[styles.allLabel, { color: colors.text }]}>Tüm değerlendirmeleri gör ({count})</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text} />
        </Pressable>
      ) : null}
      {modals}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, marginTop: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 16, fontWeight: "700" },
  link: { fontSize: 13, fontWeight: "700" },
  loader: { marginVertical: 16 },
  empty: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, borderStyle: "dashed" },
  emptyText: { flex: 1, fontSize: 13, lineHeight: 19 },
  writeButton: { height: 46, borderRadius: 23, borderWidth: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  writeLabel: { fontSize: 14, fontWeight: "700" },
  notice: { fontSize: 13, fontWeight: "600" },
  allButton: { height: 46, borderRadius: 23, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  allLabel: { fontSize: 14, fontWeight: "700" },
});
