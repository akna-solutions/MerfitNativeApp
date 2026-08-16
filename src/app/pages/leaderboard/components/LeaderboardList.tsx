import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { LeaderboardEntry } from "../types";
import { LeaderboardRow } from "./LeaderboardRow";
import { TopThree } from "./TopThree";

type Props = { entries: LeaderboardEntry[]; anonymized?: boolean };

export function LeaderboardList({ entries, anonymized }: Props) {
  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <View>
      <Text style={styles.sectionTitle}>Top 10 Türkiye</Text>

      <View style={styles.podiumCard}>
        <TopThree entries={topThree} />
      </View>

      <View style={styles.listCard}>
        {rest.map((entry) => (
          <LeaderboardRow
            key={entry.id}
            entry={entry}
            showRewardBadge
            anonymized={anonymized}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  podiumCard: {
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  listCard: {
    marginTop: 12,
    borderRadius: 20,
    padding: 8,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
