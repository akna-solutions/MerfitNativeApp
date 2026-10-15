import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { formatRepRange } from "../../../../shared/workout/progression";

type Props = {
  name: string;
  sets: number;
  reps: number;
  /** Tekrar araliginin ust siniri; verilirse "8-12 tekrar" gosterilir. */
  repsMax?: number | null;
  restSec: number;
  /** Cift progresyon onerisi ("Bu sefer 62.5 kg ile 8-12 tekrar dene."). */
  nextTarget?: string | null;
};

export function ExerciseInfo({ name, sets, reps, repsMax, restSec, nextTarget }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {sets} set × {formatRepRange(reps, repsMax)} tekrar
      </Text>
      <Text style={[styles.rest, { color: colors.textSecondary }]}>{restSec} sn dinlenme</Text>
      {nextTarget ? (
        <Text style={[styles.target, { color: colors.primary }]} accessibilityLabel={`Hedef: ${nextTarget}`}>
          Hedef: {nextTarget}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", marginTop: 20 },
  name: { fontSize: 24, fontWeight: "700" },
  meta: { fontSize: 13, marginTop: 6 },
  rest: { fontSize: 12, marginTop: 4, opacity: 0.8 },
  target: { fontSize: 13, fontWeight: "600", marginTop: 8, textAlign: "center", paddingHorizontal: 24 },
});
