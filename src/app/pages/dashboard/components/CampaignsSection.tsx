import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CampaignListItem } from "../../../../services/api/types";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  campaigns: CampaignListItem[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSelect: (campaign: CampaignListItem) => void;
  horizontalInset?: number;
};

export const CAMPAIGN_CARD_WIDTH = 264;
const GAP = 14;

function CampaignImage({ uri }: { uri: string | null }) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <View style={[styles.image, styles.imageFallback, { backgroundColor: colors.cardActive }]}>
        <Ionicons name="pricetag-outline" size={28} color={colors.primary} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={styles.image}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={200}
      onError={() => setFailed(true)}
      accessible={false}
    />
  );
}

/** Ana sayfadaki "Kampanyalar" bolumu (eski "Senin İçin Önerilenler" yerine). Veriler admin panelinden yonetilir. */
export function CampaignsSection({ campaigns, loading, error, onRetry, onSelect, horizontalInset = 24 }: Props) {
  const { colors } = useTheme();

  let body: React.ReactNode;
  if (loading && campaigns.length === 0) {
    body = (
      <View style={[styles.row, { paddingHorizontal: horizontalInset }]} testID="campaigns-loading">
        {[0, 1].map((i) => (
          <View key={i} style={[styles.card, styles.skeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.image, { backgroundColor: colors.inputBackground }]} />
            <View style={[styles.skeletonLine, { backgroundColor: colors.inputBackground, width: "70%" }]} />
            <View style={[styles.skeletonLine, { backgroundColor: colors.inputBackground, width: "45%" }]} />
          </View>
        ))}
      </View>
    );
  } else if (error && campaigns.length === 0) {
    body = (
      <Pressable
        testID="campaigns-error"
        onPress={onRetry}
        accessibilityRole="button"
        style={[styles.message, { marginHorizontal: horizontalInset, backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.messageText, { color: colors.textSecondary }]}>Kampanyalar yüklenemedi.</Text>
        <Text style={[styles.retry, { color: colors.primary }]}>Tekrar dene</Text>
      </Pressable>
    );
  } else if (campaigns.length === 0) {
    body = (
      <View
        testID="campaigns-empty"
        style={[styles.message, { marginHorizontal: horizontalInset, backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Ionicons name="pricetags-outline" size={20} color={colors.textSecondary} />
        <Text style={[styles.messageText, { color: colors.textSecondary }]}>Şu an aktif bir kampanya yok. Yeni fırsatlar burada görünecek.</Text>
      </View>
    );
  } else {
    body = (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CAMPAIGN_CARD_WIDTH + GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={[styles.row, { paddingHorizontal: horizontalInset }]}
      >
        {campaigns.map((campaign) => (
          <Pressable
            key={campaign.id}
            testID={`campaign-card-${campaign.id}`}
            onPress={() => onSelect(campaign)}
            accessibilityRole="button"
            accessibilityLabel={`Kampanya: ${campaign.title}${campaign.summary ? `. ${campaign.summary}` : ""}`}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <CampaignImage uri={campaign.imageUrl} />
            <View style={styles.cardBody}>
              {campaign.category ? (
                <Text style={[styles.category, { color: colors.primary }]} numberOfLines={1}>{campaign.category.toLocaleUpperCase("tr-TR")}</Text>
              ) : null}
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{campaign.title}</Text>
              {campaign.summary ? (
                <Text style={[styles.summary, { color: colors.textSecondary }]} numberOfLines={2}>{campaign.summary}</Text>
              ) : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionTitle, { color: colors.text, marginHorizontal: horizontalInset }]}>Kampanyalar</Text>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 28 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  row: { flexDirection: "row", gap: GAP },
  card: {
    width: CAMPAIGN_CARD_WIDTH,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  skeleton: { paddingBottom: 14, gap: 8 },
  skeletonLine: { height: 10, borderRadius: 5, marginHorizontal: 14 },
  image: { width: "100%", height: 132 },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  cardBody: { padding: 14, gap: 4 },
  category: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  title: { fontSize: 15, fontWeight: "700" },
  summary: { fontSize: 12, lineHeight: 17 },
  message: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    alignItems: "center",
    gap: 6,
  },
  messageText: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  retry: { fontSize: 13, fontWeight: "700" },
});
