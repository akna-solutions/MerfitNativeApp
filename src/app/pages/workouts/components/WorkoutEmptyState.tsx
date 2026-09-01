import { StyleSheet, Text, View } from "react-native";

import { OnboardingButton } from "../../onboarding/components/OnboardingButton";
import { colors } from "../theme";

type Props = {
  onClearFilters: () => void;
};

export function WorkoutEmptyState({ onClearFilters }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Antrenman bulunamadı.</Text>
      <Text style={styles.description}>
        Filtrelerini değiştirmeyi veya başka bir antrenman aramayı dene.
      </Text>
      <View style={styles.button}>
        <OnboardingButton label="Filtreleri Temizle" onPress={onClearFilters} />
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
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  button: { alignSelf: "stretch", marginTop: 20 },
});
