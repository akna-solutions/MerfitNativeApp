import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
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
        setLabel("0g 00s 00d");
        return;
      }
      const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diffMs / (60 * 60 * 1000)) % 24);
      const minutes = Math.floor((diffMs / (60 * 1000)) % 60);
      setLabel(
        `${days}g ${hours.toString().padStart(2, "0")}s ${minutes.toString().padStart(2, "0")}d`,
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
  const { colors } = useTheme();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const countdown = useCountdown(resetAt);

  const [first, second, third, ...rest] = rewards;
  const inRewardZone = currentRank <= 10;

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Bu Ayın Ödülleri</Text>
        <Text style={[styles.countdown, { color: colors.textSecondary }]}>{countdown} sonra yenilenir</Text>
      </View>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        İlk 10'a gir ve özel ödüller kazan.
      </Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

        <View style={[styles.motivation, { borderTopColor: colors.border }]}>
          {inRewardZone ? (
            <Text style={[styles.motivationText, { color: colors.textSecondary }]}>
              You're #{currentRank} — you're in the reward zone.
            </Text>
          ) : (
            <Text style={[styles.motivationText, { color: colors.textSecondary }]}>
              You're #{currentRank}. Only{" "}
              <Text style={[styles.motivationAccent, { color: colors.primary }]}>
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
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  countdown: { fontSize: 11, fontWeight: "600" },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  card: {
    borderRadius: 22,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
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
  },
  motivationText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  motivationAccent: { fontWeight: "700" },
});
