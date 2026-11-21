import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleProp, StyleSheet, ViewStyle } from "react-native";

import { BrandLoader } from "../brand/BrandLoader";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  /** ActivityIndicator ile ayni: "small" (20), "large" (36) ya da piksel. */
  size?: "small" | "large" | number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const SIZES = { small: 20, large: 36 } as const;

/**
 * Uygulama genelindeki yukleniyor gostergesi. Kucuk boyutlar (buton ici, satir ici) donen dumbell'dir;
 * "large" tam ekran bekleme durumlari icindir ve markali BrandLoader'i (donen halka + "MB" monogrami) gosterir.
 */
export function DumbbellSpinner({ size = "small", color = "#999999", style, testID }: Props) {
  if (size === "large") {
    return <LargeBrandLoader color={color} style={style} testID={testID} />;
  }
  return <InlineDumbbellSpinner size={size} color={color} style={style} testID={testID} />;
}

function LargeBrandLoader({ color, style, testID }: Pick<Props, "color" | "style" | "testID">) {
  return <BrandLoader size={52} color={color} markColor={useThemeTextColor()} style={style} testID={testID} />;
}

/** Monogram rengi temadan gelir; ThemeProvider disinda (orn. izole testler) varsayilan beyaz kullanilir. */
function useThemeTextColor(): string | undefined {
  try {
    return useTheme().colors.text;
  } catch {
    return undefined;
  }
}

function InlineDumbbellSpinner({ size, color, style, testID }: Required<Pick<Props, "size" | "color">> & Props) {
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
