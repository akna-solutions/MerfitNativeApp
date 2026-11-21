import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlassSurface } from "../../../../shared/glass/GlassSurface";
import { glassBlueTint, glassTokens, useLiquidGlass } from "../../../../shared/glass/liquidGlass";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  points: number;
  weeklyChange: number;
  /** Tum zamanlar sirasi; hic puani yoksa null. */
  rank: number | null;
  onPress: () => void;
};

export function ScoreCard({ points, weeklyChange, rank, onPress }: Props) {
  const { colors, isDark } = useTheme();
  const liquidGlass = useLiquidGlass();
  return (
    // iOS 26+: MB FIT puani mavi tonlu Liquid Glass kart; kenardaki mavi cizgi marka vurgusu olarak kalir.
    <Pressable onPress={onPress} style={({ pressed }) => (liquidGlass && pressed ? styles.pressedGlass : null)}>
      <GlassSurface
        enabled={liquidGlass}
        tintColor={glassBlueTint(isDark)}
        style={styles.card}
        fallbackStyle={{ backgroundColor: colors.card }}
      >
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>MB FIT Puanın</Text>
        <Text style={[styles.points, { color: colors.text }]}>{points.toLocaleString()}</Text>
        <Text style={[styles.change, { color: colors.primary }]}>+{weeklyChange.toLocaleString()} son 7 günde</Text>
        <Text style={[styles.rank, { color: colors.textSecondary }]}>
          {rank ? `🇹🇷 Türkiye'de #${rank}` : "Puan kazan, sıralamaya katıl · Ödülleri gör"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressedGlass: { transform: [{ scale: 0.985 }] },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,168,255,0.28)",
  },
  textBlock: { flex: 1 },
  title: { fontSize: 12, fontWeight: "600" },
  points: {
    fontSize: 30,
    fontWeight: "700",
    marginTop: 6,
  },
  change: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  rank: { fontSize: 12, marginTop: 10 },
});
