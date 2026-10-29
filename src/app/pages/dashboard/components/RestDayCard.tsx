import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { MiniGameModal } from "../../../../shared/miniGame/dumbbellDash/MiniGameModal";

type Props = {
  /** Dumbbell Dash'ten puan kazanilinca cagrilir (dashboard verisini yeniler). */
  onRewardGranted?: () => void;
};

/**
 * Aktif programda bugun antrenman yoksa ana sayfada "Antrenmana Başla" kartinin yerine (yarim genislik)
 * gosterilir: kullanici bugunun dinlenme gunu oldugunu acikca gorur ve Dumbbell Dash ile MB FIT puani
 * toplamaya devam edebilir.
 */
export function RestDayCard({ onRewardGranted }: Props) {
  const { colors } = useTheme();
  const [gameOpen, setGameOpen] = useState(false);

  return (
    <>
      <View
        testID="rest-day-card"
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View
          accessible
          accessibilityLabel="Bugün dinlenme günü. Programında bugün antrenman yok. Dumbbell Dash ile MB FIT puanı toplamaya devam edebilirsin."
        >
          <View style={styles.topRow}>
            <View style={[styles.icon, { backgroundColor: colors.inputBackground }]}>
              <Ionicons name="moon" size={18} color={colors.text} />
            </View>
            <Text style={[styles.badge, { color: colors.textSecondary }]}>BUGÜN</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Dinlenme Günü</Text>
          <Text style={[styles.text, { color: colors.textSecondary }]} numberOfLines={3}>
            Kasların toparlansın. Hafif yürüyüş veya esneme iyi gelir.
          </Text>
        </View>
        <Pressable
          testID="rest-day-play-game"
          onPress={() => setGameOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Dumbbell Dash oyna"
          style={({ pressed }) => [styles.cta, { backgroundColor: colors.text, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="game-controller" size={14} color={colors.background} />
          <Text style={[styles.ctaLabel, { color: colors.background }]} numberOfLines={1}>Dumbbell Dash</Text>
        </Pressable>
      </View>

      <MiniGameModal
        visible={gameOpen}
        onClose={() => setGameOpen(false)}
        onRewardGranted={onRewardGranted}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 208,
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 20,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  badge: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  title: { fontSize: 16, fontWeight: "800", marginTop: 12 },
  text: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  cta: {
    minHeight: 34,
    borderRadius: 11,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  ctaLabel: { fontSize: 12, fontWeight: "800" },
});
