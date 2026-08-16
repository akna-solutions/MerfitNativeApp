import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { Reward } from "../types";
import { RewardCard } from "./RewardCard";
import { RewardDetailModal } from "./RewardDetailModal";

type Props = {
  rewards: Reward[];
  resetAt: Date;
  currentRank: number;
  pointsToRewardZone: number;
};

function useCountdown(target: Date) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function update() {
      const diffMs = target.getTime() - Date.now();
      if (diffMs <= 0) {
        setLabel("0d 00h 00m");
        return;
      }
      const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diffMs / (60 * 60 * 1000)) % 24);
      const minutes = Math.floor((diffMs / (60 * 1000)) % 60);
      setLabel(
        `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`,
      );
    }
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [target]);

  return label;
}

export function RewardsSection({
  rewards,
  resetAt,
  currentRank,
  pointsToRewardZone,
}: Props) {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const countdown = useCountdown(resetAt);

  const [first, second, third, ...rest] = rewards;
  const inRewardZone = currentRank <= 10;

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>This Month's Rewards</Text>
        <Text style={styles.countdown}>Resets in {countdown}</Text>
      </View>
      <Text style={styles.subtitle}>
        Reach the top 10 and earn exclusive rewards.
      </Text>

      <View style={styles.card}>
        {first ? (
          <View style={styles.first}>
            <RewardCard
              reward={first}
              size="large"
              onPress={() => setSelectedReward(first)}
            />
          </View>
        ) : null}

        <View style={styles.secondThirdRow}>
          {second ? (
            <RewardCard
              reward={second}
              onPress={() => setSelectedReward(second)}
            />
          ) : null}
          {third ? (
            <RewardCard
              reward={third}
              onPress={() => setSelectedReward(third)}
            />
          ) : null}
        </View>

        {rest.length > 0 ? (
          <View style={styles.restGrid}>
            {rest.map((reward) => (
              <View key={reward.rank} style={styles.restItem}>
                <RewardCard
                  reward={reward}
                  size="small"
                  onPress={() => setSelectedReward(reward)}
                />
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.motivation}>
          {inRewardZone ? (
            <Text style={styles.motivationText}>
              You're #{currentRank} — you're in the reward zone.
            </Text>
          ) : (
            <Text style={styles.motivationText}>
              You're #{currentRank}. Only{" "}
              <Text style={styles.motivationAccent}>
                {pointsToRewardZone.toLocaleString()} points
              </Text>{" "}
              away from a reward.
            </Text>
          )}
        </View>
      </View>

      <RewardDetailModal
        reward={selectedReward}
        onClose={() => setSelectedReward(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  countdown: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  card: {
    borderRadius: 22,
    padding: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  first: { alignItems: "center" },
  secondThirdRow: { flexDirection: "row", gap: 16, marginTop: 22 },
  restGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 22,
    rowGap: 18,
  },
  restItem: { width: "25%" },
  motivation: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  motivationText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  motivationAccent: { color: colors.electricBlue, fontWeight: "700" },
});
