import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OnboardingButton } from "../../onboarding/components/OnboardingButton";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  onResume: () => void;
  onExit: () => void;
};

export function PauseOverlay({ onResume, onExit }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.content} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={[styles.title, { color: colors.text }]}>Antrenman Duraklatıldı</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Biraz mola ver.</Text>
        </View>

        <View style={styles.actions}>
          <OnboardingButton label="Devam Et" onPress={onResume} />
          <View style={styles.exitGap}>
            <OnboardingButton
              label="Antrenmandan Çık"
              onPress={onExit}
              variant="text"
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(5,5,5,0.92)",
  },
  content: { flex: 1, justifyContent: "space-between", paddingHorizontal: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 8 },
  actions: { paddingBottom: 16 },
  exitGap: { marginTop: 4 },
});
