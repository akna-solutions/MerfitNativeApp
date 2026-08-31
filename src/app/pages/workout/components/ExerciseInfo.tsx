import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  name: string;
  sets: number;
  reps: number;
  restSec: number;
};

export function ExerciseInfo({ name, sets, reps, restSec }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.meta}>
        {sets} set × {reps} tekrar
      </Text>
      <Text style={styles.rest}>{restSec} sn dinlenme</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", marginTop: 20 },
  name: { color: colors.textPrimary, fontSize: 24, fontWeight: "700" },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
  rest: { color: colors.textMuted, fontSize: 12, marginTop: 4, opacity: 0.8 },
});
