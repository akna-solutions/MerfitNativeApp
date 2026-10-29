import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { DumbbellSpinner } from "../../../shared/motion/DumbbellSpinner";
import { Campaign, Category, ProductSummary } from "../types";
import { DiscountBadge, PriceTag } from "./PriceTag";
import { ProductCard } from "./ProductCard";
import { ProductImage } from "./ProductImage";

export const GUTTER = 20;
export const CAMPAIGN_CARD_WIDTH = 288;

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${title}: ${actionLabel}`}>
          <Text style={[styles.sectionAction, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type CampaignCardProps = { campaign: Campaign; onPress: () => void };

export const CampaignCard = memo(function CampaignCard({ campaign, onPress }: CampaignCardProps) {
  const { colors } = useTheme();
  const product = campaign.featuredProduct;
  return (
    <Pressable
      testID={`campaign-${campaign.id}`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={campaign.discountPercentage > 0 ? `${campaign.title}, en fazla yüzde ${campaign.discountPercentage} indirim` : campaign.title}
      style={[styles.campaign, { backgroundColor: campaign.tint, borderColor: colors.border }]}
    >
      <ProductImage uri={campaign.image} icon="pricetag-outline" style={StyleSheet.absoluteFill} iconSize={44} />
      <View style={styles.campaignShade} />
      <View style={styles.campaignTop}>
        <DiscountBadge percent={campaign.discountPercentage} />
        <Text style={styles.campaignCount}>{campaign.productCount} ürün</Text>
      </View>
      <View style={styles.campaignBottom}>
        <Text style={styles.campaignTitle} numberOfLines={2}>
          {campaign.title}
        </Text>
        {product ? (
          <View style={styles.campaignPrice}>
            <PriceTag onDark price={product.price} originalPrice={product.discountPercentage > 0 ? product.originalPrice : undefined} />
          </View>
        ) : null}
        <View style={[styles.campaignCta, { backgroundColor: colors.primary }]}>
          <Text style={styles.campaignCtaText}>Ürünleri İncele</Text>
          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
        </View>
      </View>
    </Pressable>
  );
});

export const CategoryTile = memo(function CategoryTile({ category, onPress, selected }: { category: Category; onPress: () => void; selected?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={`category-${category.id}`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={category.name}
      accessibilityState={{ selected: Boolean(selected) }}
      style={[styles.category, { backgroundColor: colors.card, borderColor: selected ? colors.primary : colors.border }]}
    >
      <ProductImage uri={category.image} icon={category.icon} style={styles.categoryImage} iconSize={26} />
      <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={2}>
        {category.name}
      </Text>
    </Pressable>
  );
});

const keyOf = (p: ProductSummary) => p.id;

type ProductRowProps = {
  products: ProductSummary[];
  cardWidth?: number;
  /** Verilirse serit yuklenirken / hata olunca yerinde durum gosterir. */
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyText?: string;
  testID?: string;
};

/** Yatay urun seridi (FlatList; sanallastirilmis). Yukleniyor, hata ve bos durumlarini da cizer. */
export function ProductRow({ products, cardWidth = 156, isLoading, error, onRetry, emptyText, testID }: ProductRowProps) {
  const { colors } = useTheme();
  if (isLoading && products.length === 0) {
    return (
      <View style={styles.rowState} testID={testID ? `${testID}-loading` : undefined}>
        <DumbbellSpinner color={colors.primary} />
      </View>
    );
  }
  if (error && products.length === 0) {
    return (
      <View style={[styles.rowState, styles.rowStateText]} testID={testID ? `${testID}-error` : undefined}>
        <Text style={[styles.rowMessage, { color: colors.textSecondary }]} numberOfLines={2}>
          {error}
        </Text>
        {onRetry ? (
          <Pressable onPress={onRetry} hitSlop={8} accessibilityRole="button" accessibilityLabel="Tekrar dene">
            <Text style={[styles.sectionAction, { color: colors.primary }]}>Tekrar dene</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  if (products.length === 0) {
    return emptyText ? (
      <View style={[styles.rowState, styles.rowStateText]} testID={testID ? `${testID}-empty` : undefined}>
        <Text style={[styles.rowMessage, { color: colors.textSecondary }]}>{emptyText}</Text>
      </View>
    ) : null;
  }
  return (
    <FlatList
      horizontal
      data={products}
      keyExtractor={keyOf}
      renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rowContent}
      ItemSeparatorComponent={RowGap}
      initialNumToRender={4}
      testID={testID}
    />
  );
}

function RowGap() {
  return <View style={styles.rowGap} />;
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: GUTTER, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", flexShrink: 1 },
  sectionAction: { fontSize: 13, fontWeight: "700" },
  campaign: { width: CAMPAIGN_CARD_WIDTH, height: 188, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, justifyContent: "space-between", padding: 14 },
  campaignShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(5,5,7,0.62)" },
  campaignTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  campaignCount: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "600" },
  campaignBottom: { gap: 6 },
  campaignTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  campaignPrice: { alignSelf: "flex-start" },
  campaignCta: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, height: 32, paddingHorizontal: 14, borderRadius: 16 },
  campaignCtaText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  category: { width: 104, borderRadius: 14, borderWidth: 1, padding: 8, gap: 8 },
  categoryImage: { width: "100%", aspectRatio: 1.25, borderRadius: 10 },
  categoryName: { fontSize: 12, fontWeight: "600", minHeight: 30 },
  rowContent: { paddingHorizontal: GUTTER },
  rowGap: { width: 12 },
  rowState: { height: 120, alignItems: "center", justifyContent: "center", paddingHorizontal: GUTTER },
  rowStateText: { gap: 8 },
  rowMessage: { fontSize: 13, textAlign: "center" },
});
