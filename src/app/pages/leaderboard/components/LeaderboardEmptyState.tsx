import { StyleSheet, Text, View } from "react-native";

import { OnboardingButton } from "../../onboarding/components/OnboardingButton";
import { colors } from "../theme";

type Props = { onStartWorkout: () => void };

export function LeaderboardEmptyState({ onStartWorkout }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Sıralama tablosu hazırlanıyor.</Text>
      <Text style={styles.description}>
        MB FIT Puanı kazanmaya başlamak için ilk antrenmanını tamamla.
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
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
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
