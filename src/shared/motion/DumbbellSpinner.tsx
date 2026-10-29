import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleProp, StyleSheet, ViewStyle } from "react-native";

type Props = {
  /** ActivityIndicator ile ayni: "small" (20), "large" (36) ya da piksel. */
  size?: "small" | "large" | number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const SIZES = { small: 20, large: 36 } as const;

/** Uygulama genelindeki yukleniyor gostergesi: ActivityIndicator yerine donen dumbell. */
export function DumbbellSpinner({ size = "small", color = "#999999", style, testID }: Props) {
  const rotation = useRef(new Animated.Value(0)).current;
  const iconSize = typeof size === "number" ? size : SIZES[size];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel="Yükleniyor"
      style={[styles.box, { width: iconSize + 4, height: iconSize + 4 }, style, { transform: [{ rotate }] }]}
    >
      <Ionicons name="barbell" size={iconSize} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", justifyContent: "center", alignSelf: "center" },
});
