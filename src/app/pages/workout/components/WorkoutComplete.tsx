import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OnboardingButton } from "../../onboarding/components/OnboardingButton";
import { colors } from "../theme";

type Props = {
  durationLabel: string;
  exerciseCount: number;
  setCount: number;
  onViewSummary: () => void;
  onDone: () => void;
};

export function WorkoutComplete({
  durationLabel,
  exerciseCount,
  setCount,
  onViewSummary,
  onDone,
}: Props) {
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.center}>
        <View style={styles.badge}>
          <Ionicons name="checkmark" size={30} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>WORKOUT COMPLETE</Text>
        <Text style={styles.subtitle}>Great work!</Text>

        <View style={styles.statsRow}>
          <Stat value={durationLabel} label="Duration" />
          <View style={styles.divider} />
          <Stat value={`${exerciseCount}`} label="Exercises" />
          <View style={styles.divider} />
          <Stat value={`${setCount}`} label="Sets" />
        </View>
      </View>

      <View style={styles.footer}>
        <OnboardingButton label="View Summary" onPress={onViewSummary} />
        <View style={styles.doneGap}>
          <OnboardingButton label="Done" onPress={onDone} variant="text" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.buttonElectricBlue,
    marginBottom: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1,
  },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 8 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 32,
    gap: 20,
  },
  stat: { alignItems: "center" },
  statValue: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: colors.border,
  },
  footer: { paddingBottom: 8 },
  doneGap: { marginTop: 2 },
});
