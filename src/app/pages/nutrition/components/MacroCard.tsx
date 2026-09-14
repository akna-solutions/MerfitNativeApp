import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

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
  const { colors } = useTheme();
  const ratio = target > 0 ? Math.min(1, consumed / target) : 0;
  const percent = Math.round(ratio * 100);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        fullWidth ? styles.fullWidth : styles.half,
      ]}
    >
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>
        {consumed}
        <Text style={[styles.unit, { color: colors.textSecondary }]}> / {target} g</Text>
      </Text>

      <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.primary }]} />
      </View>
      <Text style={[styles.percent, { color: colors.textSecondary }]}>{percent}%</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  half: { flex: 1 },
  fullWidth: { alignSelf: "stretch" },
  label: { fontSize: 13, fontWeight: "700" },
  value: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 8,
  },
  unit: { fontSize: 12, fontWeight: "600" },
  track: {
    height: 5,
    borderRadius: 3,
    marginTop: 12,
    overflow: "hidden",
  },
  fill: { height: 5, borderRadius: 3 },
  percent: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: "600",
  },
});
