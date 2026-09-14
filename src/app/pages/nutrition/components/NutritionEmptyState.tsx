import { StyleSheet, Text, View } from "react-native";

import { OnboardingButton } from "../../onboarding/components/OnboardingButton";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = { onAddFirstMeal: () => void };

export function NutritionEmptyState({ onAddFirstMeal }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.badge, { backgroundColor: colors.cardActive, borderColor: colors.primary }]}>
        <Text style={[styles.badgeGlyph, { color: colors.primary }]}>+</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Beslenme yolculuğun burada başlıyor.</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Günlük beslenmeni takip etmeye başlamak için ilk öğününü ekle.
      </Text>
      <View style={styles.button}>
        <OnboardingButton label="İlk Öğünü Ekle" onPress={onAddFirstMeal} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: 18,
  },
  badgeGlyph: { fontSize: 24, fontWeight: "700" },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  button: { alignSelf: "stretch", marginTop: 20 },
});
