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
 * Aktif programda bugun antrenman yoksa "Bugünün Antrenmanı" yerine gosterilir: kullanici bugunun
 * dinlenme gunu oldugunu acikca gorur ve Dumbbell Dash ile MB FIT puani toplamaya devam edebilir.
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
          style={styles.row}
        >
          <View style={[styles.icon, { backgroundColor: colors.inputBackground }]}>
            <Ionicons name="moon" size={20} color={colors.text} />
          </View>
          <View style={styles.body}>
            <Text style={[styles.badge, { color: colors.textSecondary }]}>BUGÜN</Text>
            <Text style={[styles.title, { color: colors.text }]}>Dinlenme Günü</Text>
            <Text style={[styles.text, { color: colors.textSecondary }]}>
              Programında bugün antrenman yok. Kasların toparlansın; istersen hafif yürüyüş veya esneme yapabilirsin.
            </Text>
            <Text style={[styles.text, { color: colors.text }]}>
              Dumbbell Dash ile MB FIT puanı toplamaya devam edebilirsin.
            </Text>
          </View>
        </View>
        <Pressable
          testID="rest-day-play-game"
          onPress={() => setGameOpen(true)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, { backgroundColor: colors.text, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="game-controller" size={16} color={colors.background} />
          <Text style={[styles.ctaLabel, { color: colors.background }]}>Dumbbell Dash Oyna</Text>
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
    gap: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: "row", gap: 14 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  body: { flex: 1 },
  badge: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  title: { fontSize: 18, fontWeight: "700", marginTop: 2 },
  text: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  cta: {
    minHeight: 46,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: { fontSize: 14, fontWeight: "800" },
});
