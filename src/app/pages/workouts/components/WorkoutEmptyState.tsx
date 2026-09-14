import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { OnboardingButton } from "../../onboarding/components/OnboardingButton";

type Props = {
  onClearFilters: () => void;
};

export function WorkoutEmptyState({ onClearFilters }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Antrenman bulunamadı.</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 16, fontWeight: "700" },
  description: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  button: { alignSelf: "stretch", marginTop: 20 },
});
