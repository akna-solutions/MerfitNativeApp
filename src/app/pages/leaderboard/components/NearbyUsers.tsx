import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { LeaderboardEntry } from "../types";
import { LeaderboardRow } from "./LeaderboardRow";

type Props = { entries: LeaderboardEntry[]; anonymized?: boolean };

export function NearbyUsers({ entries, anonymized }: Props) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Çevrendekiler</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
