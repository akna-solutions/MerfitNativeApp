import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = { onViewSuggestions: () => void };

export function NutritionInsight({ onViewSuggestions }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onViewSuggestions} style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Ionicons
          name="sparkles-outline"
          size={16}
          color={colors.primary}
        />
        <Text style={[styles.title, { color: colors.primary }]}>MB FIT AI</Text>
      </View>

      <Text style={[styles.message, { color: colors.text }]}>
        Bugün protein alımın düşük. Bir sonraki öğününe Yunan yoğurdu, yumurta
        veya tavuk eklemeyi dene.
      </Text>

      <View style={styles.footer}>
        <Text style={[styles.link, { color: colors.primary }]}>Önerileri görüntüle</Text>
        <Ionicons name="arrow-forward" size={13} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(0,168,255,0.28)",
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  footer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  link: { fontSize: 12, fontWeight: "700" },
});
