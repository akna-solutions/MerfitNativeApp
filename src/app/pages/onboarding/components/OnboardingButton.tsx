import { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "text";
  /** true iken buton devre disi kalir ve etiket yerine bir spinner gosterilir (orn. API istegi devam ediyorken). */
  isLoading?: boolean;
};

export function OnboardingButton({
  label,
  onPress,
  disabled,
  variant = "primary",
  isLoading = false,
}: Props) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || isLoading;

  const press = (toValue: number) => {
    if (isDisabled) return;
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  if (variant === "text") {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} hitSlop={8}>
        <Text style={[styles.textLabel, { color: colors.textSecondary }]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      onPressIn={() => press(0.97)}
      onPressOut={() => press(1)}
      hitSlop={8}
    >
      <Animated.View
        style={[
          styles.primary,
          { backgroundColor: colors.primaryPressed },
          isDisabled && styles.primaryDisabled,
          { transform: [{ scale }] },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text
            style={[
              styles.primaryLabel,
              disabled && styles.primaryLabelDisabled,
            ]}
          >
            {label}
          </Text>
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
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 14,
    letterSpacing: 0.3,
  },
});
