import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  isPlusUser: boolean;
  onPress: () => void;
};

export function PlusStatusCard({ isPlusUser, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.card },
        isPlusUser && { borderColor: colors.primary },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.cardActive }]}>
        <Ionicons name="flash" size={16} color={colors.primary} />
      </View>

      <View style={styles.textBlock}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>MB FIT Plus</Text>
          {isPlusUser ? (
            <View style={[styles.activeBadge, { backgroundColor: colors.primaryPressed }]}>
              <Text style={styles.activeBadgeLabel}>AKTİF</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {isPlusUser
            ? "Premium deneyimin açık."
            : "Gelişmiş özelliklerin kilidini aç."}
        </Text>
      </View>

      {!isPlusUser ? (
        <View style={[styles.cta, { backgroundColor: colors.primaryPressed }]}>
          <Text style={styles.ctaLabel}>Plus'ı Gör</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
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
    borderWidth: 1,
    borderColor: "rgba(0,168,255,0.28)",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 14, fontWeight: "700" },
  activeBadge: {
    paddingHorizontal: 8,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBadgeLabel: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
  description: { fontSize: 11, marginTop: 3 },
  cta: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
});
