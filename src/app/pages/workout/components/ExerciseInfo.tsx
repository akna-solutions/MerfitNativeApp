import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  name: string;
  sets: number;
  reps: number;
  restSec: number;
};

export function ExerciseInfo({ name, sets, reps, restSec }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {sets} set × {reps} tekrar
      </Text>
      <Text style={[styles.rest, { color: colors.textSecondary }]}>{restSec} sn dinlenme</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", marginTop: 20 },
  name: { fontSize: 24, fontWeight: "700" },
  meta: { fontSize: 13, marginTop: 6 },
  rest: { fontSize: 12, marginTop: 4, opacity: 0.8 },
});
