import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

function Shimmer({ style }: { style: object }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[style, { opacity }]} />;
}

export function LeaderboardSkeleton() {
  const { colors } = useTheme();
  return (
    <View>
      <Shimmer style={[styles.headerCard, { backgroundColor: colors.card }]} />
      <Shimmer style={[styles.rewardsCard, { backgroundColor: colors.card }]} />
      <View style={styles.rows}>
        {[1, 2, 3, 4, 5].map((key) => (
          <Shimmer key={key} style={[styles.row, { backgroundColor: colors.card }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    height: 180,
    borderRadius: 22,
    marginTop: 20,
  },
  rewardsCard: {
    height: 220,
    borderRadius: 22,
    marginTop: 28,
  },
  rows: { marginTop: 28, gap: 10 },
  row: { height: 56, borderRadius: 14 },
});
