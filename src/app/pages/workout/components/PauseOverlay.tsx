import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OnboardingButton } from "../../onboarding/components/OnboardingButton";
import { colors } from "../theme";

type Props = {
  onResume: () => void;
  onExit: () => void;
};

export function PauseOverlay({ onResume, onExit }: Props) {
  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.content} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.title}>Workout Paused</Text>
          <Text style={styles.subtitle}>Take a break.</Text>
        </View>

        <View style={styles.actions}>
          <OnboardingButton label="Resume" onPress={onResume} />
          <View style={styles.exitGap}>
            <OnboardingButton
              label="Exit Workout"
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,5,5,0.92)",
  },
  content: { flex: 1, justifyContent: "space-between", paddingHorizontal: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 8 },
  actions: { paddingBottom: 16 },
  exitGap: { marginTop: 4 },
});
