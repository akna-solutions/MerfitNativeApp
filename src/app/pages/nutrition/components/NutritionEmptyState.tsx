import { StyleSheet, Text, View } from "react-native";

import { OnboardingButton } from "../../onboarding/components/OnboardingButton";
import { colors } from "../theme";

type Props = { onAddFirstMeal: () => void };

export function NutritionEmptyState({ onAddFirstMeal }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeGlyph}>+</Text>
      </View>
      <Text style={styles.title}>Beslenme yolculuğun burada başlıyor.</Text>
      <Text style={styles.description}>
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
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardBackgroundActive,
    borderWidth: 1.5,
    borderColor: colors.electricBlue,
    marginBottom: 18,
  },
  badgeGlyph: { color: colors.electricBlue, fontSize: 24, fontWeight: "700" },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  button: { alignSelf: "stretch", marginTop: 20 },
});
