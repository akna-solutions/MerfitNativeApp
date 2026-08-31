import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  isPlusUser: boolean;
  onPress: () => void;
};

export function PlusStatusCard({ isPlusUser, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, isPlusUser && styles.cardActive]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="flash" size={16} color={colors.electricBlue} />
      </View>

      <View style={styles.textBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>MERFIT Plus</Text>
          {isPlusUser ? (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeLabel}>AKTİF</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.description}>
          {isPlusUser
            ? "Premium deneyimin açık."
            : "Gelişmiş özelliklerin kilidini aç."}
        </Text>
      </View>

      {!isPlusUser ? (
        <View style={styles.cta}>
          <Text style={styles.ctaLabel}>Plus'ı Gör</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 18,
    gap: 14,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: "rgba(0,168,255,0.28)",
  },
  cardActive: { borderColor: colors.electricBlue },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardBackgroundActive,
  },
  textBlock: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  activeBadge: {
    paddingHorizontal: 8,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.buttonElectricBlue,
  },
  activeBadgeLabel: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
  description: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  cta: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.buttonElectricBlue,
  },
  ctaLabel: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
});
