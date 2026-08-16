import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { Reward } from "../types";
import { RewardImage } from "./RewardImage";

type Props = {
  reward: Reward;
  onPress: () => void;
  size?: "large" | "medium" | "small";
};

export function RewardCard({ reward, onPress, size = "medium" }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <RewardImage icon={reward.icon} size={size} />
      <View style={styles.rankBadge}>
        <Text style={styles.rankLabel}>#{reward.rank}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {reward.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", flex: 1 },
  rankBadge: {
    marginTop: 10,
    paddingHorizontal: 10,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardBackgroundActive,
  },
  rankLabel: { color: colors.electricBlue, fontSize: 10, fontWeight: "700" },
  title: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
});
