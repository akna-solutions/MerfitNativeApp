import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PremiumFeature } from "../../../shared/plus/components/PremiumFeature";
import { useProfile } from "../../../shared/profile/ProfileContext";
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
import {
    ACHIEVEMENTS,
    CURRENT_USER_ENTRY,
    MOCK_CURRENT_USER,
    NEARBY_USERS,
    REWARDS,
    REWARDS_RESET_AT,
    SCORE_BREAKDOWN,
    SCORE_HISTORY,
    TOP_10_TURKIYE,
    TOP_PERCENT,
} from "./mockData";
import { colors } from "./theme";
import { PeriodFilter as PeriodFilterType } from "./types";

export function LeaderboardScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const [period, setPeriod] = useState<PeriodFilterType>("month");
  const [loading, setLoading] = useState(true);
  const anonymized = !profile.privacy.profileVisibleOnLeaderboard;

  // TODO: Backend/API bağlandığında period değiştikçe gerçek veri
  // çekilecek. Şimdilik mock veri period'dan bağımsız sabit.
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(timeout);
  }, []);

  const hasScoreData = MOCK_CURRENT_USER.points > 0;
  const tenthPlacePoints =
    TOP_10_TURKIYE[TOP_10_TURKIYE.length - 1]?.points ?? 0;
  const pointsToRewardZone = Math.max(
    0,
    tenthPlacePoints - CURRENT_USER_ENTRY.points,
  );

  const currentIndex = NEARBY_USERS.findIndex((entry) => entry.isCurrentUser);
  const nextUser = currentIndex > 0 ? NEARBY_USERS[currentIndex - 1] : null;
  const pointsToNextRank = nextUser
    ? nextUser.points - CURRENT_USER_ENTRY.points
    : 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.padded}>
            <LeaderboardHeader
              onBack={() => router.back()}
              currentRank={CURRENT_USER_ENTRY.rank}
              points={MOCK_CURRENT_USER.points}
              topPercent={TOP_PERCENT}
              league={MOCK_CURRENT_USER.league}
              bestRank={MOCK_CURRENT_USER.bestRank}
              bestRankMonthLabel={MOCK_CURRENT_USER.bestRankMonthLabel}
            />
          </View>

          {loading ? (
            <View style={styles.padded}>
              <LeaderboardSkeleton />
            </View>
          ) : !hasScoreData ? (
            <View style={styles.padded}>
              <LeaderboardEmptyState
                onStartWorkout={() => router.push("/pages/workouts")}
              />
            </View>
          ) : (
            <>
              <View style={[styles.padded, styles.sectionGap]}>
                <RewardsSection
                  rewards={REWARDS}
                  resetAt={REWARDS_RESET_AT}
                  currentRank={CURRENT_USER_ENTRY.rank}
                  pointsToRewardZone={pointsToRewardZone}
                />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <PeriodFilter value={period} onChange={setPeriod} />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <LeaderboardList
                  entries={TOP_10_TURKIYE}
                  anonymized={anonymized}
                />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <NearbyUsers entries={NEARBY_USERS} anonymized={anonymized} />
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <PremiumFeature feature="ADVANCED_LEADERBOARD">
                  <AdvancedLeaderboardInsights />
                </PremiumFeature>
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <PremiumFeature feature="DETAILED_SCORE">
                  <ScoreBreakdown items={SCORE_BREAKDOWN} />
                </PremiumFeature>
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <PremiumFeature feature="DETAILED_SCORE">
                  <ScoreChart
                    points={MOCK_CURRENT_USER.points}
                    weeklyChange={MOCK_CURRENT_USER.weeklyChange}
                    history={SCORE_HISTORY}
                  />
                </PremiumFeature>
              </View>

              <View style={[styles.padded, styles.sectionGap]}>
                <Achievements achievements={ACHIEVEMENTS} />
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
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 40 },
  padded: { paddingHorizontal: 24 },
  sectionGap: { marginTop: 28 },
});
