import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "../../../../services/api/client";
import { WorkoutHistoryItem } from "../../../../services/api/types";
import { getWorkoutHistory } from "../../../../services/api/workoutSessions";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import { formatHistoryDate, formatKg, formatMinutes } from "../../../../shared/workoutHistory/format";

const PAGE_SIZE = 20;

/** Kullanicinin tamamladigi antrenmanlarin listesi (GET /api/workout-sessions). */
export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [items, setItems] = useState<WorkoutHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadFirstPage = useCallback(async (signal?: AbortSignal) => {
    setErrorMessage(null);
    try {
      const result = await getWorkoutHistory(1, PAGE_SIZE, signal);
      setItems(result.items);
      setPage(1);
      setHasNextPage(result.hasNextPage);
    } catch (error) {
      if (signal?.aborted) return;
      if (error instanceof ApiError && error.isUnauthorized) {
        router.replace("/pages/login");
        return;
      }
      setErrorMessage(
        error instanceof ApiError ? error.message : "Antrenman geçmişi yüklenemedi.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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
      const result = await getWorkoutHistory(page + 1, PAGE_SIZE);
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        return [...prev, ...result.items.filter((item) => !seen.has(item.id))];
      });
      setPage(page + 1);
      setHasNextPage(result.hasNextPage);
    } catch {
      // Sonraki sayfa yuklenemezse liste oldugu gibi kalir; kullanici tekrar kaydirabilir.
    } finally {
      setIsLoadingMore(false);
    }
  };

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
          <Text style={[styles.title, { color: colors.text }]}>Antrenman Geçmişi</Text>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
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
        ) : items.length === 0 ? (
          <View style={styles.centered}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Henüz kayıtlı antrenman yok</Text>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>
              Tamamladığın antrenmanlar, yaptığın set ve kilolarla birlikte burada görünecek.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              isLoadingMore ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null
            }
            renderItem={({ item }) => (
              <HistoryRow
                item={item}
                onPress={() =>
                  router.push({
                    pathname: "/pages/workout/history/[id]",
                    params: { id: String(item.id) },
                  } as never)
                }
              />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function HistoryRow({ item, onPress }: { item: WorkoutHistoryItem; onPress: () => void }) {
  const { colors } = useTheme();
  const meta = [
    formatMinutes(item.durationSeconds),
    `${item.exerciseCount} egzersiz`,
    `${item.setCount} set`,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="button"
    >
      <View style={styles.cardTop}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title || "Antrenman"}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </View>
      <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
        {formatHistoryDate(item.completedAt)}
      </Text>
      <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>{meta.join(" · ")}</Text>
      {item.totalVolumeKg > 0 || item.maxWeightKg ? (
        <View style={styles.statsRow}>
          {item.totalVolumeKg > 0 ? (
            <Text style={[styles.stat, { color: colors.text }]}>Hacim {formatKg(item.totalVolumeKg)}</Text>
          ) : null}
          {item.maxWeightKg ? (
            <Text style={[styles.stat, { color: colors.text }]}>En ağır {formatKg(item.maxWeightKg)}</Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  muted: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  emptyTitle: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  retryButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  retryLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  footer: { marginVertical: 16 },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700" },
  cardDate: { fontSize: 12, marginTop: 4 },
  cardMeta: { fontSize: 12, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 16, marginTop: 10 },
  stat: { fontSize: 12, fontWeight: "600" },
});
