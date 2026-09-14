import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

export function AdvancedLeaderboardInsights() {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        <Ionicons name="trending-up" size={16} color={colors.primary} />
        <Text style={[styles.text, { color: colors.text }]}>
          Sıralaman bu ay 32 basamak yükseldi.
        </Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="time-outline" size={16} color={colors.primary} />
        <Text style={[styles.text, { color: colors.text }]}>
          18 gündür üst üste ilk 200'desin.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  text: { fontSize: 12, fontWeight: "600", flex: 1 },
});
