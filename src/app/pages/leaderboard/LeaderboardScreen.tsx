import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PremiumFeature } from "../../../shared/plus/components/PremiumFeature";
import { useProfile } from "../../../shared/profile/ProfileContext";
import { ApiError } from "../../../services/api/client";
import { getLeaderboard } from "../../../services/api/leaderboard";
import { LeaderboardResponse } from "../../../services/api/types";
import { Achievements } from "./components/Achievements";
import { AdvancedLeaderboardInsights } from "./components/AdvancedLeaderboardInsights";
import { LeaderboardEmptyState } from "./components/LeaderboardEmptyState";
import { LeaderboardHeader } from "./components/LeaderboardHeader";
import { LeaderboardList } from "./components/LeaderboardList";
import { LeaderboardSkeleton } from "./components/LeaderboardSkeleton";
import { MotivationCard } from "./components/MotivationCard";
import { NearbyUsers } from "./components/NearbyUsers";
import { PeriodFilter } from "./components/PeriodFilter";
import { RewardsSection } from "./components/RewardsSection";
import { ScoreBreakdown } from "./components/ScoreBreakdown";
import { ScoreChart } from "./components/ScoreChart";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { PeriodFilter as PeriodFilterType } from "./types";

export function LeaderboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useProfile();
  const [period, setPeriod] = useState<PeriodFilterType>("month");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const anonymized = !profile.privacy.profileVisibleOnLeaderboard;

  const loadLeaderboard = useCallback(async (p: PeriodFilterType, signal?: AbortSignal) => {
    setErrorMessage(null);
    try {
      const response = await getLeaderboard(p, signal);
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

  useEffect(() => {
    setIsLoading(true);
    const controller = new AbortController();
    loadLeaderboard(period, controller.signal);
    return () => controller.abort();
  }, [period, loadLeaderboard]);

  if (errorMessage) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{errorMessage}</Text>
        <Pressable
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setIsLoading(true);
            loadLeaderboard(period);
          }}
        >
          <Text style={styles.retryLabel}>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }

  const tenthPlacePoints = data?.topEntries[data.topEntries.length - 1]?.points ?? 0;
  const pointsToRewardZone = data
    ? Math.max(0, tenthPlacePoints - data.currentUser.points)
    : 0;

  const currentIndex = data?.nearbyEntries.findIndex((entry) => entry.isCurrentUser) ?? -1;
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
                currentRank={data.currentUser.bestRank}
                points={data.currentUser.points}
                topPercent={data.topPercent}
                league={data.currentUser.league}
                bestRank={data.currentUser.bestRank}
                bestRankMonthLabel={data.currentUser.bestRankMonthLabel}
              />
            ) : null}
          </View>

          {isLoading || !data ? (
            <View style={styles.padded}>
              <LeaderboardSkeleton />
            </View>
          ) : !data.hasScoreData ? (
            <View style={styles.padded}>
              <LeaderboardEmptyState
                onStartWorkout={() => router.push("/pages/workouts")}
              />
            </View>
          ) : (
            <>
              {data.rewardsResetAt ? (
                <View style={[styles.padded, styles.sectionGap]}>
                  <RewardsSection
                    rewards={data.rewards}
                    resetAt={new Date(data.rewardsResetAt)}
                    currentRank={data.currentUser.bestRank}
                    pointsToRewardZone={pointsToRewardZone}
                  />
                </View>
              ) : null}

              <View style={[styles.padded, styles.sectionGap]}>
                <PeriodFilter value={period} onChange={setPeriod} />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <LeaderboardList
                  entries={data.topEntries}
                  anonymized={anonymized}
                />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <NearbyUsers entries={data.nearbyEntries} anonymized={anonymized} />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <PremiumFeature feature="ADVANCED_LEADERBOARD">
                  <AdvancedLeaderboardInsights />
                </PremiumFeature>
              </View>

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

              <View style={[styles.padded, styles.sectionGap]}>
                <Achievements achievements={data.achievements} />
              </View>

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
