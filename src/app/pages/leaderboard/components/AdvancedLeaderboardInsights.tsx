import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

export function AdvancedLeaderboardInsights() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="trending-up" size={16} color={colors.electricBlue} />
        <Text style={styles.text}>
          Your rank improved 32 positions this month.
        </Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="time-outline" size={16} color={colors.electricBlue} />
        <Text style={styles.text}>
          You've been in the top 200 for 18 days straight.
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
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  text: { color: colors.textPrimary, fontSize: 12, fontWeight: "600", flex: 1 },
});
