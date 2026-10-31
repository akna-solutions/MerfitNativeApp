import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DumbbellSpinner } from "../motion/DumbbellSpinner";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "../../services/api/client";
import { getNotifications, markAllNotificationsRead } from "../../services/api/notifications";
import { resolveNotificationRoute } from "./navigation";
import { NotificationApp, NotificationCategory, NotificationItem } from "../../services/api/types";
import {
  formatNotificationTime,
  groupNotificationsByDay,
} from "./groupByDay";
import { useTheme } from "../theme/ThemeContext";

const PAGE_SIZE = 30;

const CATEGORY_TITLES: Record<NotificationCategory, string> = {
  workout: "Antrenman Bildirimleri",
  nutrition: "Beslenme Bildirimleri",
  general: "Bildirimler",
  shop: "MB Shop Bildirimleri",
};

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  WorkoutReminder: "barbell-outline",
  GoalReminder: "flag-outline",
  StreakReminder: "flame-outline",
  ProgressUpdate: "trending-up-outline",
  LeaderboardUpdate: "trophy-outline",
  Achievement: "medal-outline",
  Reward: "gift-outline",
  Subscription: "sparkles-outline",
  System: "shield-checkmark-outline",
  Marketing: "megaphone-outline",
  NutritionReminder: "restaurant-outline",
  WaterReminder: "water-outline",
  DailyMotivation: "sunny-outline",
  Announcement: "megaphone-outline",
  StoreOrderUpdate: "cube-outline",
  StorePromotion: "pricetag-outline",
};

/** Bolume gore metinler ve rotalar. MB FIT ve MB Shop gelen kutulari ayridir. */
const APP_CONFIG: Record<NotificationApp, { title: string; empty: string; settingsRoute: string; selfRoute: string; homeRoute: string }> = {
  mbfit: {
    title: "Bildirimler",
    empty: "Hatırlatmalar ve güncellemeler burada görünecek.",
    settingsRoute: "/pages/profile/notifications",
    selfRoute: "/pages/notifications",
    homeRoute: "/pages/dashboard",
  },
  mbshop: {
    title: "MB Shop Bildirimleri",
    empty: "Sipariş güncellemelerin ve MB Shop kampanyaları burada görünecek.",
    settingsRoute: "/pages/store/notification-settings",
    selfRoute: "/pages/store/notifications",
    homeRoute: "/pages/store",
  },
};

/**
 * Bildirim listesi, gunlere bolunmus (Bugun / Dun / tarih). `app` hangi gelen kutusunun gosterilecegini
 * belirler: MB FIT (/pages/notifications) ve MB Shop (/pages/store/notifications) ayri listelerdir.
 * `?category=nutrition` ile yalnizca o kategorinin bildirimleri gosterilir (Beslenme ekranindaki zil).
 * Ekran acildiginda listelenen bolumdeki bildirimler okundu olarak isaretlenir; okunmamislar bu ziyarette vurgulu kalir.
 */
export function NotificationInbox({ app }: { app: NotificationApp }) {
  const router = useRouter();
  const { colors } = useTheme();
  const config = APP_CONFIG[app];
  const params = useLocalSearchParams<{ category?: string }>();
  const category: NotificationCategory | undefined =
    app === "mbfit" && (params.category === "nutrition" || params.category === "workout" || params.category === "general")
      ? params.category
      : undefined;

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadFirstPage = useCallback(async (signal?: AbortSignal) => {
    setErrorMessage(null);
    try {
      const result = await getNotifications({ app, category, page: 1, pageSize: PAGE_SIZE }, signal);
      setItems(result.items);
      setPage(1);
      setHasNextPage(result.hasNextPage);
      if (result.items.some((item) => !item.isRead)) {
        markAllNotificationsRead(category, app).catch(() => {
          // Okundu isaretlenemezse bir sonraki ziyarette tekrar denenir.
        });
      }
    } catch (error) {
      if (signal?.aborted) return;
      if (error instanceof ApiError && error.isUnauthorized) {
        router.replace("/pages/login");
        return;
      }
      setErrorMessage(error instanceof ApiError ? error.message : "Bildirimler yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }, [app, category, router]);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      loadFirstPage(controller.signal);
      return () => controller.abort();
    }, [loadFirstPage]),
  );

  const loadMore = async () => {
    if (!hasNextPage || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const result = await getNotifications({ app, category, page: page + 1, pageSize: PAGE_SIZE });
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        return [...prev, ...result.items.filter((item) => !seen.has(item.id))];
      });
      setPage(page + 1);
      setHasNextPage(result.hasNextPage);
    } catch {
      // Sonraki sayfa yuklenemezse liste oldugu gibi kalir.
    } finally {
      setIsLoadingMore(false);
    }
  };

  const sections = useMemo(() => groupNotificationsByDay(items), [items]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace(config.homeRoute as never))}
            hitSlop={12}
            style={[styles.backButton, { backgroundColor: colors.inputBackground }]}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>
            {category ? CATEGORY_TITLES[category] : config.title}
          </Text>
          <Pressable
            onPress={() => router.push(config.settingsRoute as never)}
            hitSlop={12}
            style={[styles.backButton, styles.settingsButton, { backgroundColor: colors.inputBackground }]}
            accessibilityRole="button"
            accessibilityLabel="Bildirim ayarları"
          >
            <Ionicons name="settings-outline" size={18} color={colors.text} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <DumbbellSpinner color={colors.primary} size="large" />
          </View>
        ) : errorMessage ? (
          <View style={styles.centered}>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>{errorMessage}</Text>
            <Pressable
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setIsLoading(true);
                loadFirstPage();
              }}
            >
              <Text style={styles.retryLabel}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="notifications-off-outline" size={32} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Henüz bildirimin yok</Text>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>
              {category === "nutrition"
                ? "Beslenme ve su hatırlatmaların burada görünecek."
                : config.empty}
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            stickySectionHeadersEnabled={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            renderSectionHeader={({ section }) => (
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
            )}
            renderItem={({ item }) => {
              // Yalnizca izinli ekranlara yonlendirilir; bu ekrana isaret eden veya hedefsiz satirlara dokunulamaz.
              const route = resolveNotificationRoute(item.data);
              const target = route && route !== config.selfRoute ? route : null;
              return (
                <NotificationRow
                  item={item}
                  onPress={target ? () => router.push(target as never) : undefined}
                />
              );
            }}
            ListFooterComponent={
              isLoadingMore ? <DumbbellSpinner color={colors.primary} style={styles.footer} /> : undefined
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function NotificationRow({ item, onPress }: { item: NotificationItem; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={({ pressed }) => [
        pressed && styles.cardPressed,
        styles.card,
        { backgroundColor: item.isRead ? colors.card : colors.cardActive, borderColor: colors.border },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name={TYPE_ICONS[item.type] ?? "notifications-outline"} size={18} color={colors.primary} />
      </View>
      <View style={styles.cardText}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.cardTime, { color: colors.textSecondary }]}>
            {formatNotificationTime(item.createdAt)}
          </Text>
        </View>
        <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{item.body}</Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={styles.chevron} /> : null}
      {!item.isRead ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  settingsButton: { marginLeft: "auto" },
  title: { fontSize: 20, fontWeight: "700", flexShrink: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  muted: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  emptyTitle: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  retryButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  retryLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  footer: { marginVertical: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3, marginTop: 16, marginBottom: 8 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 10,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  cardText: { flex: 1 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "700" },
  cardTime: { fontSize: 11 },
  cardBody: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  cardPressed: { opacity: 0.7 },
  chevron: { marginTop: 10 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
