import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

/**
 * Aktif programda bugun antrenman yoksa "Bugünün Antrenmanı" yerine gosterilir: kullanici bugunun
 * dinlenme gunu oldugunu acikca gorur.
 */
export function RestDayCard() {
  const { colors } = useTheme();

  return (
    <View
      testID="rest-day-card"
      accessible
      accessibilityLabel="Bugün dinlenme günü. Programında bugün antrenman yok."
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 14,
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  body: { flex: 1 },
  badge: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  title: { fontSize: 18, fontWeight: "700", marginTop: 2 },
  text: { fontSize: 13, lineHeight: 19, marginTop: 6 },
});
