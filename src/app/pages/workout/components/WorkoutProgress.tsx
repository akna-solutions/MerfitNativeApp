import { StyleSheet, View } from "react-native";

import { colors } from "../theme";

type Props = { current: number; total: number };

export function WorkoutProgress({ current, total }: Props) {
  const ratio = total > 0 ? Math.min(1, current / total) : 0;

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.progressTrack,
    overflow: "hidden",
  },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.electricBlue },
});
