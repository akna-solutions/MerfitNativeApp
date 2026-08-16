import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { colors } from "../theme";

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
  return (
    <View>
      <Shimmer style={styles.headerCard} />
      <Shimmer style={styles.rewardsCard} />
      <View style={styles.rows}>
        {[1, 2, 3, 4, 5].map((key) => (
          <Shimmer key={key} style={styles.row} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    height: 180,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    marginTop: 20,
  },
  rewardsCard: {
    height: 220,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    marginTop: 28,
  },
  rows: { marginTop: 28, gap: 10 },
  row: { height: 56, borderRadius: 14, backgroundColor: colors.cardBackground },
});
