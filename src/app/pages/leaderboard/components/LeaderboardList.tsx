import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { LeaderboardEntry } from "../types";
import { LeaderboardRow } from "./LeaderboardRow";
import { TopThree } from "./TopThree";

type Props = { entries: LeaderboardEntry[]; anonymized?: boolean };

export function LeaderboardList({ entries, anonymized }: Props) {
  const { colors } = useTheme();
  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Türkiye İlk 10</Text>

      <View style={[styles.podiumCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TopThree entries={topThree} />
      </View>

      <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  podiumCard: {
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  listCard: {
    marginTop: 12,
    borderRadius: 20,
    padding: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
