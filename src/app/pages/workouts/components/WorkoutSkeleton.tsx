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

export function WorkoutSkeleton() {
  const { colors } = useTheme();
  return (
    <View>
      <Shimmer style={[styles.featured, { backgroundColor: colors.card }]} />
      <View style={styles.grid}>
        {[1, 2, 3, 4].map((key) => (
          <Shimmer key={key} style={[styles.card, { backgroundColor: colors.card }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  featured: {
    height: 260,
    borderRadius: 24,
    marginBottom: 28,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47.5%",
    height: 168,
    borderRadius: 16,
  },
});
