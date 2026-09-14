import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

export function AiNutritionPlanCard() {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons
          name="sparkles-outline"
          size={16}
          color={colors.primary}
        />
        <Text style={[styles.title, { color: colors.primary }]}>YAPAY ZEKA BESLENME PLANI</Text>
      </View>
      <Text style={[styles.description, { color: colors.text }]}>
        Hedefine göre oluşturulmuş kişiselleştirilmiş öğünler, makro hedefleri
        ve günlük beslenme önerileri.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
});
