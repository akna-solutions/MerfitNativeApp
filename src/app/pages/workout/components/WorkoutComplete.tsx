import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DumbbellSpinner } from "../../../../shared/motion/DumbbellSpinner";
import { SafeAreaView } from "react-native-safe-area-context";

import { OnboardingButton } from "../../onboarding/components/OnboardingButton";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import type { SaveStatus } from "../ActiveWorkout";

type Props = {
  durationLabel: string;
  exerciseCount: number;
  setCount: number;
  saveStatus: SaveStatus;
  saveError?: string | null;
  onRetrySave: () => void;
  onViewSummary: () => void;
  onDone: () => void;
};

export function WorkoutComplete({
  durationLabel,
  exerciseCount,
  setCount,
  saveStatus,
  saveError,
  onRetrySave,
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

        <View style={styles.saveRow}>
          {saveStatus === "saving" ? (
            <>
              <DumbbellSpinner size="small" color={colors.textSecondary} />
              <Text style={[styles.saveText, { color: colors.textSecondary }]}>Kaydediliyor…</Text>
            </>
          ) : saveStatus === "saved" ? (
            <>
              <Ionicons name="cloud-done-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.saveText, { color: colors.textSecondary }]}>
                Antrenman geçmişine kaydedildi
              </Text>
            </>
          ) : saveStatus === "error" ? (
            <View style={styles.saveErrorBlock}>
              <Text style={[styles.saveText, styles.centerText, { color: colors.danger }]}>
                {saveError ?? "Antrenman kaydedilemedi."}
              </Text>
              <Pressable onPress={onRetrySave} hitSlop={8}>
                <Text style={[styles.retry, { color: colors.primary }]}>Tekrar dene</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.footer}>
        <OnboardingButton label="Özeti Gör" onPress={onViewSummary} />
        <View style={styles.doneGap}>
          <OnboardingButton
            label="Bitti"
            onPress={onDone}
            variant="secondary"
            disabled={saveStatus === "saving"}
          />
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
  saveRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 28, minHeight: 20 },
  saveText: { fontSize: 13 },
  saveErrorBlock: { alignItems: "center", gap: 8, paddingHorizontal: 12 },
  centerText: { textAlign: "center" },
  retry: { fontSize: 14, fontWeight: "700" },
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
  doneGap: { marginTop: 12 },
});
