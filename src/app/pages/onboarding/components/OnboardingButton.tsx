import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "text";
};

export function OnboardingButton({
  label,
  onPress,
  disabled,
  variant = "primary",
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const press = (toValue: number) => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  if (variant === "text") {
    return (
      <Pressable onPress={onPress} disabled={disabled} hitSlop={8}>
        <Text style={styles.textLabel}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={() => press(0.97)}
      onPressOut={() => press(1)}
      hitSlop={8}
    >
      <Animated.View
        style={[
          styles.primary,
          disabled && styles.primaryDisabled,
          { transform: [{ scale }] },
        ]}
      >
        <Text
          style={[styles.primaryLabel, disabled && styles.primaryLabelDisabled]}
        >
          {label}
        </Text>
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
    backgroundColor: colors.buttonElectricBlue,
  },
  primaryDisabled: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  primaryLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  primaryLabelDisabled: {
    color: "rgba(255,255,255,0.35)",
  },
  textLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 14,
    letterSpacing: 0.3,
  },
});
