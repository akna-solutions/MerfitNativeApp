import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  label: string;
  consumed: number;
  target: number;
  onPress: () => void;
  fullWidth?: boolean;
};

export function MacroCard({
  label,
  consumed,
  target,
  onPress,
  fullWidth,
}: Props) {
  const ratio = target > 0 ? Math.min(1, consumed / target) : 0;
  const percent = Math.round(ratio * 100);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, fullWidth ? styles.fullWidth : styles.half]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>
        {consumed}
        <Text style={styles.unit}> / {target} g</Text>
      </Text>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.percent}>{percent}%</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  half: { flex: 1 },
  fullWidth: { alignSelf: "stretch" },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  value: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 8,
  },
  unit: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.progressTrack,
    marginTop: 12,
    overflow: "hidden",
  },
  fill: { height: 5, borderRadius: 3, backgroundColor: colors.electricBlue },
  percent: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
    fontWeight: "600",
  },
});
