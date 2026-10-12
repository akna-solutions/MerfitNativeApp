import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { GoalProgress } from "../types";

type Props = { goal: GoalProgress };

export function GoalProgressCard({ goal }: Props) {
  const { colors } = useTheme();
  const { currentWeightKg, goalWeightKg, startWeightKg } = goal;
  // Ilerleme hedefin yonune gore olculur: kilo vermede kilo almak ilerleme sayilmaz.
  const totalDistance = goalWeightKg - startWeightKg;
  const remaining = Math.round((goalWeightKg - currentWeightKg) * 10) / 10;
  const isMaintain = Math.abs(totalDistance) < 0.5;
  const ratio = isMaintain
    ? (Math.abs(remaining) <= 1 ? 1 : 0)
    : Math.min(1, Math.max(0, (currentWeightKg - startWeightKg) / totalDistance));
  const reached = isMaintain ? Math.abs(remaining) <= 1 : ratio >= 1;
  const remainingLabel = reached
    ? isMaintain ? "Kilonu koruyorsun" : "Hedefine ulaştın"
    : `${remaining < 0 ? "-" : "+"}${Math.abs(remaining).toFixed(1)} kg hedefe kaldı`;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>İlerlemen</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}>
          <View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Kilo</Text>
            <Text style={[styles.value, { color: colors.text }]}>{currentWeightKg} kg</Text>
          </View>
          <View style={styles.alignEnd}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Hedef</Text>
            <Text style={[styles.value, { color: colors.text }]}>{goalWeightKg} kg</Text>
          </View>
        </View>

        <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
          <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: colors.primary }]} />
        </View>

        <Text style={[styles.remaining, { color: colors.primary }]}>{remainingLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 28 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  alignEnd: { alignItems: "flex-end" },
  label: { fontSize: 11 },
  value: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  track: {
    height: 6,
    borderRadius: 3,
    marginTop: 16,
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: 3 },
  remaining: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },
});
