import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  onBack: () => void;
  currentRank: number;
  points: number;
  topPercent: number;
  league: string;
  bestRank: number;
  bestRankMonthLabel: string;
};

export function LeaderboardHeader({
  onBack,
  currentRank,
  points,
  topPercent,
  league,
  bestRank,
  bestRankMonthLabel,
}: Props) {
  const { colors } = useTheme();
  return (
    <View>
      <View style={styles.topRow}>
        <Pressable onPress={onBack} hitSlop={12} style={[styles.backButton, { backgroundColor: colors.inputBackground }]}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.text }]}>MB FIT Sıralaması</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Türkiye genelinde sıralamanı gör.</Text>
        </View>
        <View style={styles.backButtonGhost} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.country, { color: colors.textSecondary }]}>Türkiye</Text>
        <Text style={[styles.rank, { color: colors.text }]}>#{currentRank}</Text>
        <Text style={[styles.rankLabel, { color: colors.textSecondary }]}>Mevcut sıralaman</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{points.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>MB FIT Puanı</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>İlk %{topPercent}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{league} Ligi</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>#{bestRank}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En İyi · {bestRankMonthLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonGhost: { width: 36, height: 36 },
  titleBlock: { flex: 1, alignItems: "center" },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 11, marginTop: 2 },
  card: {
    marginTop: 20,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  country: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  rank: {
    fontSize: 42,
    fontWeight: "700",
    marginTop: 8,
  },
  rankLabel: { fontSize: 12, marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    width: "100%",
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 15, fontWeight: "700" },
  statLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
  },
});
