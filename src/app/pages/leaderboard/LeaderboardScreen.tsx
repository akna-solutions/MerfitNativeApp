import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DumbbellSpinner } from "../../../shared/motion/DumbbellSpinner";
import { SafeAreaView } from "react-native-safe-area-context";

import { MiniGameCard } from "../../../shared/miniGame/dumbbellDash/MiniGameCard";
import { PremiumFeature } from "../../../shared/plus/components/PremiumFeature";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { ApiError } from "../../../services/api/client";
import { getLeaderboard } from "../../../services/api/leaderboard";
import { LeaderboardResponse } from "../../../services/api/types";
import { Achievements } from "./components/Achievements";
import { EarnedRewards } from "./components/EarnedRewards";
import { AdvancedLeaderboardInsights } from "./components/AdvancedLeaderboardInsights";
import { LeaderboardEmptyState } from "./components/LeaderboardEmptyState";
import { LeaderboardHeader } from "./components/LeaderboardHeader";
import { LeaderboardList } from "./components/LeaderboardList";
import { LeaderboardSkeleton } from "./components/LeaderboardSkeleton";
import { MotivationCard } from "./components/MotivationCard";
import { RewardsSection } from "./components/RewardsSection";
import { ScoreBreakdown } from "./components/ScoreBreakdown";
import { ScoreChart } from "./components/ScoreChart";
import { useTheme } from "../../../shared/theme/ThemeContext";

// Siralama yalnizca aylik puanla gosterilir; donem secimi kaldirildi.
const PERIOD = "month" as const;

export function LeaderboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useProfile();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const anonymized = !profile.privacy.profileVisibleOnLeaderboard;

  const loadLeaderboard = useCallback(async (signal?: AbortSignal) => {
    setErrorMessage(null);
    try {
      const response = await getLeaderboard(PERIOD, signal);
      setData(response);
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        router.replace("/pages/login");
        return;
      }
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Liderlik tablosu yüklenemedi. Lütfen tekrar deneyin.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Mini oyundan puan kazanilinca ekran sessizce (iskelet gostermeden) guncellenir; hata olursa mevcut
  // veri korunur, bir sonraki acilista yeniden denenir.
  const refreshAfterReward = useCallback(async () => {
    try {
      setData(await getLeaderboard(PERIOD));
    } catch {
      // Sessiz yenileme: ekrandaki veriyi bozma.
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const controller = new AbortController();
    loadLeaderboard(controller.signal);
    return () => controller.abort();
  }, [loadLeaderboard]);

  if (errorMessage) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{errorMessage}</Text>
        <Pressable
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setIsLoading(true);
            loadLeaderboard();
          }}
        >
          <Text style={styles.retryLabel}>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }

  const currentRank = data?.currentUser.rank ?? null;
  const lastRewardRank = data && data.rewards.length > 0
    ? Math.max(...data.rewards.map((reward) => reward.rank))
    : 10;
  // Odul verilen son siradaki kullanicinin puani; o sira henuz dolmadiysa 1 puan yeterli.
  const lastRewardRankPoints = data?.topEntries.find((entry) => entry.rank === lastRewardRank)?.points ?? 0;
  const pointsToRewardZone = data
    ? Math.max(1, lastRewardRankPoints - data.currentUser.points + 1)
    : 0;

  const currentIndex = data?.nearbyEntries.findIndex((entry) => entry.isCurrentUser) ?? -1;
  // Ilk 10'da degilse kullanicinin kendi satiri listenin altinda gosterilir.
  const currentUserEntry = data && !data.topEntries.some((entry) => entry.isCurrentUser)
    ? data.nearbyEntries.find((entry) => entry.isCurrentUser) ?? null
    : null;
  const nextUser = data && currentIndex > 0 ? data.nearbyEntries[currentIndex - 1] : null;
  const pointsToNextRank = nextUser ? nextUser.points - data!.currentUser.points : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.padded}>
            {data ? (
              <LeaderboardHeader
                onBack={() => router.back()}
                currentRank={currentRank}
                points={data.currentUser.points}
                topPercent={data.topPercent}
                league={data.currentUser.league}
                bestRank={data.currentUser.bestRank}
                bestRankMonthLabel={data.currentUser.bestRankMonthLabel}
              />
            ) : null}
          </View>

          <View style={[styles.padded, styles.sectionGap]}>
            <MiniGameCard onRewardGranted={refreshAfterReward} />
          </View>

          {isLoading || !data ? (
            <View style={[styles.padded, styles.sectionGap]}>
              <LeaderboardSkeleton />
            </View>
          ) : (
            <>
              {data.earnedRewards.length > 0 ? (
                <View style={[styles.padded, styles.sectionGap]}>
                  <EarnedRewards rewards={data.earnedRewards} />
                </View>
              ) : null}

              {data.rewardsResetAt && data.rewards.length > 0 ? (
                <View style={[styles.padded, styles.sectionGap]}>
                  <RewardsSection
                    rewards={data.rewards}
                    resetAt={new Date(data.rewardsResetAt)}
                    periodLabel="Bu Ayın"
                    currentRank={currentRank}
                    lastRewardRank={lastRewardRank}
                    pointsToRewardZone={pointsToRewardZone}
                  />
                </View>
              ) : null}

              {data.topEntries.length === 0 ? (
                <View style={styles.padded}>
                  <LeaderboardEmptyState
                    onStartWorkout={() => router.push("/pages/workouts")}
                  />
                </View>
              ) : (
                <>
                  <View style={[styles.padded, styles.sectionGap]}>
                    <LeaderboardList
                      entries={data.topEntries}
                      currentUserEntry={currentUserEntry}
                      anonymized={anonymized}
                    />
                  </View>

                  <View style={[styles.padded, styles.sectionGap]}>
                    <PremiumFeature feature="ADVANCED_LEADERBOARD">
                      <AdvancedLeaderboardInsights />
                    </PremiumFeature>
                  </View>
                </>
              )}

              {data.scoreBreakdown.length > 0 ? (
                <View style={[styles.padded, styles.sectionGap]}>
                  <PremiumFeature feature="DETAILED_SCORE">
                    <ScoreBreakdown items={data.scoreBreakdown} />
                  </PremiumFeature>
                </View>
              ) : null}

              {data.scoreHistory.length > 0 ? (
                <View style={[styles.padded, styles.sectionGap]}>
                  <PremiumFeature feature="DETAILED_SCORE">
                    <ScoreChart
                      points={data.currentUser.points}
                      weeklyChange={data.currentUser.weeklyChange}
                      history={data.scoreHistory}
                    />
                  </PremiumFeature>
                </View>
              ) : null}

              {data.achievements.length > 0 ? (
                <View style={[styles.padded, styles.sectionGap]}>
                  <Achievements achievements={data.achievements} />
                </View>
              ) : null}

              {nextUser ? (
                <View style={[styles.padded, styles.sectionGap]}>
                  <MotivationCard
                    pointsToNextRank={pointsToNextRank}
                    nextRank={nextUser.rank}
                  />
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  errorText: { fontSize: 14, textAlign: "center" },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  scrollContent: { paddingTop: 16, paddingBottom: 40 },
  padded: { paddingHorizontal: 24 },
  sectionGap: { marginTop: 28 },
});
