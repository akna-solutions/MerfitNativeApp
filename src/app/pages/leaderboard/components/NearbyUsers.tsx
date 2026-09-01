import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { LeaderboardEntry } from "../types";
import { LeaderboardRow } from "./LeaderboardRow";

type Props = { entries: LeaderboardEntry[]; anonymized?: boolean };

export function NearbyUsers({ entries, anonymized }: Props) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Çevrendekiler</Text>
      <View style={styles.card}>
        {entries.map((entry) => (
          <LeaderboardRow
            key={entry.id}
            entry={entry}
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
  card: {
    borderRadius: 20,
    padding: 8,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
