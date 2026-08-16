import { Pressable, StyleSheet, Text, View } from "react-native";

import { OnboardingButton } from "../../onboarding/components/OnboardingButton";
import { colors } from "../theme";
import { Exercise } from "../types";

type Props = {
  remainingSec: number;
  totalSec: number;
  nextExercise: Exercise | null;
  onAdjust: (deltaSec: number) => void;
  onSkip: () => void;
};

function formatTime(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function RestTimer({
  remainingSec,
  totalSec,
  nextExercise,
  onAdjust,
  onSkip,
}: Props) {
  const ratio =
    totalSec > 0 ? Math.max(0, Math.min(1, remainingSec / totalSec)) : 0;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>REST</Text>
      <Text style={styles.timer}>{formatTime(remainingSec)}</Text>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>

      <View style={styles.adjustRow}>
        <AdjustButton label="-15" onPress={() => onAdjust(-15)} />
        <AdjustButton label="+15" onPress={() => onAdjust(15)} />
      </View>

      {nextExercise ? (
        <View style={styles.nextBlock}>
          <Text style={styles.nextLabel}>NEXT EXERCISE</Text>
          <Text style={styles.nextName}>{nextExercise.name}</Text>
          <Text style={styles.nextMeta}>
            {nextExercise.sets} × {nextExercise.reps}
          </Text>
        </View>
      ) : null}

      <View style={styles.skipButton}>
        <OnboardingButton label="Skip Rest" onPress={onSkip} variant="text" />
      </View>
    </View>
  );
}

function AdjustButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={styles.adjustButtonWrapper}
    >
      <Text style={styles.adjustLabel}>{label} sec</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", paddingTop: 32 },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
  timer: {
    color: colors.textPrimary,
    fontSize: 64,
    fontWeight: "700",
    marginTop: 12,
    fontVariant: ["tabular-nums"],
  },
  track: {
    width: "70%",
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.progressTrack,
    marginTop: 22,
    overflow: "hidden",
  },
  fill: { height: 5, borderRadius: 3, backgroundColor: colors.electricBlue },
  adjustRow: { flexDirection: "row", gap: 16, marginTop: 22 },
  adjustButtonWrapper: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  adjustLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  nextBlock: { alignItems: "center", marginTop: 40 },
  nextLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  nextName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 8,
  },
  nextMeta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  skipButton: { marginTop: 28 },
});
