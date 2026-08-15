import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GlassView } from "expo-glass-effect";

import { colors } from "../theme";

type Props = {
  label: string;
  onPress: () => void;
  variant: "primary" | "secondary";
};

export function WelcomeButton({ label, onPress, variant }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const press = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => press(0.97)}
      onPressOut={() => press(1)}
      hitSlop={8}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {variant === "primary" ? (
          <LinearGradient
            colors={[colors.electricBlue, colors.violet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primary}
          >
            <Text style={styles.primaryLabel}>{label}</Text>
          </LinearGradient>
        ) : (
          <GlassView glassEffectStyle="clear" style={styles.secondary}>
            <Text style={styles.secondaryLabel}>{label}</Text>
          </GlassView>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  secondary: {
    height: 56,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
});
