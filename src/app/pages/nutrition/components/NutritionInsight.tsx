import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { NutritionInsight as NutritionInsightData } from "../../../../services/api/types";
import { useTheme } from "../../../../shared/theme/ThemeContext";

/** Sunucu degerlendirmesi gelmezse (eski API surumu) gosterilen notr metin; varsayim icermez. */
export const INSIGHT_FALLBACK_MESSAGE =
  "Bugünkü hedeflerine göre öğünlerini planlamak için beslenme asistanına danışabilirsin.";

type Props = {
  insight?: NutritionInsightData | null;
  onViewSuggestions: () => void;
};

/** Gunluk hedef ve tuketime gore sunucunun urettigi kisa degerlendirme; dokununca asistan acilir. */
export function NutritionInsight({ insight, onViewSuggestions }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID="nutrition-insight"
      accessibilityRole="button"
      accessibilityHint="Beslenme asistanını açar"
      onPress={onViewSuggestions}
      style={[styles.card, { backgroundColor: colors.card }]}
    >
      <View style={styles.header}>
        <Ionicons
          name="sparkles-outline"
          size={16}
          color={colors.primary}
        />
        <Text style={[styles.title, { color: colors.primary }]}>MB FIT AI</Text>
      </View>

      <Text style={[styles.message, { color: colors.text }]}>
        {insight?.message || INSIGHT_FALLBACK_MESSAGE}
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
