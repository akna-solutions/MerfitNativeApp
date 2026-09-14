import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OnboardingButton } from "../../onboarding/components/OnboardingButton";
import { useTheme } from "../../../../shared/theme/ThemeContext";

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
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.center}>
        <View style={[styles.badge, { backgroundColor: colors.primaryPressed }]}>
          <Ionicons name="checkmark" size={30} color="#FFFFFF" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>ANTRENMAN TAMAMLANDI</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Harika iş çıkardın!</Text>

        <View style={styles.statsRow}>
          <Stat value={durationLabel} label="Süre" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Stat value={`${exerciseCount}`} label="Egzersiz" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Stat value={`${setCount}`} label="Set" />
        </View>
      </View>

      <View style={styles.footer}>
        <OnboardingButton label="Özeti Gör" onPress={onViewSummary} />
        <View style={styles.doneGap}>
          <OnboardingButton label="Bitti" onPress={onDone} variant="text" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1,
  },
  subtitle: { fontSize: 14, marginTop: 8 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 32,
    gap: 20,
  },
  stat: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 4 },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
  },
  footer: { paddingBottom: 8 },
  doneGap: { marginTop: 2 },
});
