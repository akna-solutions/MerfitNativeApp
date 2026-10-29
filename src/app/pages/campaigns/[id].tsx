import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCampaign } from "../../../services/api/campaigns";
import { ApiError } from "../../../services/api/client";
import { CampaignDetail } from "../../../services/api/types";
import { useTheme } from "../../../shared/theme/ThemeContext";

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : null;

/** Kampanya detayi: gorsel, baslik, gecerlilik tarihi, detay metni ve (varsa) dis baglanti. */
export default function CampaignDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const load = useCallback(
    (signal?: AbortSignal) => {
      setErrorMessage(null);
      const numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        setErrorMessage("Kampanya bulunamadı.");
        return;
      }
      getCampaign(numericId, signal)
        .then(setCampaign)
        .catch((error) => {
          if (signal?.aborted) return;
          if (error instanceof ApiError && error.isUnauthorized) {
            router.replace("/pages/login");
            return;
          }
          setErrorMessage(
            error instanceof ApiError && error.status === 404
              ? "Bu kampanya artık yayında değil."
              : error instanceof ApiError
                ? error.message
                : "Kampanya yüklenemedi.",
          );
        });
    },
    [id, router],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const start = formatDate(campaign?.startAt ?? null);
  const end = formatDate(campaign?.endAt ?? null);
  const validity = start && end ? `${start} – ${end}` : end ? `${end} tarihine kadar` : start ? `${start} itibarıyla` : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/pages/dashboard"))}
            hitSlop={12}
            style={[styles.backButton, { backgroundColor: colors.inputBackground }]}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            Kampanya
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.centered}>
            <Ionicons name="pricetag-outline" size={28} color={colors.textSecondary} />
            <Text style={[styles.muted, { color: colors.textSecondary }]}>{errorMessage}</Text>
            <Pressable onPress={() => load()} accessibilityRole="button" style={[styles.retry, { borderColor: colors.border }]}>
              <Text style={[styles.retryLabel, { color: colors.text }]}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : !campaign ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {campaign.imageUrl && !imageFailed ? (
              <Image
                source={{ uri: campaign.imageUrl }}
                style={styles.image}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={250}
                onError={() => setImageFailed(true)}
                accessibilityLabel={`${campaign.title} görseli`}
              />
            ) : null}
            {campaign.category ? (
              <Text style={[styles.category, { color: colors.primary }]}>{campaign.category.toLocaleUpperCase("tr-TR")}</Text>
            ) : null}
            <Text style={[styles.title, { color: colors.text }]}>{campaign.title}</Text>
            {validity ? (
              <View style={styles.validity}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.validityText, { color: colors.textSecondary }]}>{validity}</Text>
              </View>
            ) : null}
            {campaign.summary ? <Text style={[styles.summary, { color: colors.text }]}>{campaign.summary}</Text> : null}
            {campaign.body ? <Text style={[styles.body, { color: colors.textSecondary }]}>{campaign.body}</Text> : null}
            {campaign.linkUrl ? (
              <Pressable
                onPress={() => void Linking.openURL(campaign.linkUrl as string).catch(() => undefined)}
                accessibilityRole="link"
                style={({ pressed }) => [styles.cta, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.ctaLabel}>Kampanyaya git</Text>
                <Ionicons name="open-outline" size={16} color="#FFFFFF" />
              </Pressable>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  muted: { fontSize: 14, textAlign: "center" },
  retry: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  retryLabel: { fontSize: 14, fontWeight: "700" },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  image: { width: "100%", aspectRatio: 16 / 9, borderRadius: 18, marginBottom: 8 },
  category: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: "800" },
  validity: { flexDirection: "row", alignItems: "center", gap: 6 },
  validityText: { fontSize: 13 },
  summary: { fontSize: 15, lineHeight: 22, fontWeight: "600", marginTop: 6 },
  body: { fontSize: 14, lineHeight: 22 },
  cta: {
    marginTop: 18,
    minHeight: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
