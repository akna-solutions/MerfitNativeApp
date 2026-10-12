import { StyleSheet, Text, View } from "react-native";

import { OnboardingButton } from "../../onboarding/components/OnboardingButton";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = { onStartWorkout: () => void };

export function LeaderboardEmptyState({ onStartWorkout }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Bu dönemde henüz puan kazanan yok.</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Antrenman tamamla, kişisel rekor kır, öğün ve su kaydı gir; MB FIT Puanı kazanıp sıralamada ilk yerini al.
      </Text>
      <View style={styles.button}>
        <OnboardingButton label="Antrenmana Başla" onPress={onStartWorkout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 24,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 16,
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
