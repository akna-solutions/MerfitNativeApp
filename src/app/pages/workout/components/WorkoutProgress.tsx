import { StyleSheet, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = { current: number; total: number };

export function WorkoutProgress({ current, total }: Props) {
  const { colors } = useTheme();
  const ratio = total > 0 ? Math.min(1, current / total) : 0;

  return (
    <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
      <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: { height: 4, borderRadius: 2 },
});
