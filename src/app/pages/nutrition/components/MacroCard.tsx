import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  label: string;
  consumed: number;
  target: number;
  width: number;
  onPress?: () => void;
  /** Olcu birimi; varsayilan gram. */
  unit?: string;
  /** Verilirse buyuk sayi olarak gosterilir (or. kalan kalori), tuketim satiri altta kalir. */
  headline?: string;
  headlineCaption?: string;
};

export function MacroCard({
  label,
  consumed,
  target,
  width,
  onPress,
  unit = "g",
  headline,
  headlineCaption,
}: Props) {
  const { colors } = useTheme();
  const ratio = target > 0 ? Math.min(1, consumed / target) : 0;
  const percent = Math.round(ratio * 100);

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={[styles.card, { width, backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {headline !== undefined ? (
        <>
          <Text style={[styles.headline, { color: colors.text }]}>{headline}</Text>
          <Text style={[styles.caption, { color: colors.textSecondary }]}>{headlineCaption}</Text>
        </>
      ) : null}
      <Text style={[headline !== undefined ? styles.valueSmall : styles.value, { color: colors.text }]}>
        {consumed.toLocaleString()}
        <Text style={[styles.unit, { color: colors.textSecondary }]}>
          {" "}/ {target.toLocaleString()} {unit}
        </Text>
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
    borderRadius: 20,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 13, fontWeight: "700" },
  headline: { fontSize: 34, fontWeight: "700", marginTop: 6 },
  caption: { fontSize: 12, fontWeight: "600" },
  value: { fontSize: 24, fontWeight: "700", marginTop: 10 },
  valueSmall: { fontSize: 14, fontWeight: "700", marginTop: 10 },
  unit: { fontSize: 12, fontWeight: "600" },
  track: {
    height: 6,
    borderRadius: 3,
    marginTop: 14,
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: 3 },
  percent: { fontSize: 11, marginTop: 6, fontWeight: "600" },
});
