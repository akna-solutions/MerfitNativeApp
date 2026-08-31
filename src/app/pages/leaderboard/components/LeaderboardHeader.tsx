import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

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
  return (
    <View>
      <View style={styles.topRow}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>MERFIT Sıralaması</Text>
          <Text style={styles.subtitle}>Türkiye genelinde sıralamanı gör.</Text>
        </View>
        <View style={styles.backButtonGhost} />
      </View>

      <View style={styles.card}>
        <Text style={styles.country}>Türkiye</Text>
        <Text style={styles.rank}>#{currentRank}</Text>
        <Text style={styles.rankLabel}>Mevcut sıralaman</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{points.toLocaleString()}</Text>
            <Text style={styles.statLabel}>MERFIT Puanı</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>İlk %{topPercent}</Text>
            <Text style={styles.statLabel}>{league} Ligi</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>#{bestRank}</Text>
            <Text style={styles.statLabel}>En İyi · {bestRankMonthLabel}</Text>
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
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  backButtonGhost: { width: 36, height: 36 },
  titleBlock: { flex: 1, alignItems: "center" },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  card: {
    marginTop: 20,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  country: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  rank: {
    color: colors.textPrimary,
    fontSize: 42,
    fontWeight: "700",
    marginTop: 8,
  },
  rankLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    width: "100%",
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { color: colors.electricBlue, fontSize: 15, fontWeight: "700" },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: colors.border,
  },
});
