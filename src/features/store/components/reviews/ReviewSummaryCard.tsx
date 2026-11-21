import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { ReviewSummary } from "../../types";
import { RatingStars } from "./RatingStars";

export const formatAverage = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

type Props = {
  summary: ReviewSummary;
  /** Verilirse dagilim satirlari o puana filtre uygular. */
  onSelectRating?: (rating: number) => void;
  selectedRating?: number;
};

/** Ortalama puan, toplam yorum ve 5'ten 1'e dagilim cubuklari. Degerler sunucudan gelir. */
export function ReviewSummaryCard({ summary, onSelectRating, selectedRating }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="review-summary">
      <View style={styles.scoreBlock}>
        <Text style={[styles.score, { color: colors.text }]} testID="review-average">
          {formatAverage(summary.averageRating)}
        </Text>
        <RatingStars value={summary.averageRating} size={14} />
        <Text style={[styles.count, { color: colors.textSecondary }]} testID="review-count">
          {summary.reviewCount} değerlendirme
        </Text>
      </View>
      <View style={styles.bars}>
        {summary.distribution.map((row) => {
          const selected = selectedRating === row.rating;
          const content = (
            <>
              <Text style={[styles.barLabel, { color: selected ? colors.primary : colors.text }]}>{row.rating}</Text>
              <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
                <View style={[styles.fill, { backgroundColor: colors.primary, width: `${Math.max(0, Math.min(100, row.percentage))}%` }]} />
              </View>
              <Text style={[styles.barCount, { color: colors.textSecondary }]}>{row.count}</Text>
            </>
          );
          return onSelectRating ? (
            <Pressable
              key={row.rating}
              testID={`distribution-${row.rating}`}
              onPress={() => onSelectRating(row.rating)}
              accessibilityRole="button"
              accessibilityLabel={`${row.rating} yıldız: ${row.count} yorum`}
              accessibilityState={{ selected }}
              style={styles.barRow}
            >
              {content}
            </Pressable>
          ) : (
            <View key={row.rating} style={styles.barRow} testID={`distribution-${row.rating}`} accessibilityLabel={`${row.rating} yıldız: ${row.count} yorum`}>
              {content}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: 18, padding: 16, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: "center" },
  scoreBlock: { alignItems: "center", gap: 4, minWidth: 92 },
  score: { fontSize: 40, fontWeight: "800", letterSpacing: -1 },
  count: { fontSize: 12, marginTop: 2 },
  bars: { flex: 1, gap: 6 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 20 },
  barLabel: { width: 12, fontSize: 12, fontWeight: "700", textAlign: "center" },
  track: { flex: 1, height: 7, borderRadius: 4, overflow: "hidden" },
  fill: { height: 7, borderRadius: 4 },
  barCount: { minWidth: 26, fontSize: 12, textAlign: "right" },
});
