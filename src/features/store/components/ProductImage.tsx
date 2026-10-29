import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";

type Props = {
  uri?: string | null;
  /** Yedek gorunumde gosterilen Ionicons adi (kategori ikonu). */
  icon?: string;
  /** Yedek gorunumde ikonun altinda gosterilen kisa metin (marka). */
  label?: string;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  testID?: string;
};

/** Uzak gorsel yoksa veya yuklenemezse bozuk ekran yerine tutarli bir yedek gorunum cizer. */
export function ProductImage({ uri, icon = "image-outline", label, style, iconSize = 34, testID }: Props) {
  const { colors } = useTheme();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = Boolean(uri) && failedUri !== uri;

  if (showImage) {
    return (
      <View style={[styles.box, { backgroundColor: colors.inputBackground }, style]}>
        <Image
          testID={testID}
          source={{ uri: uri as string }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
          onError={() => setFailedUri(uri ?? null)}
          accessible={false}
        />
      </View>
    );
  }
  return (
    <View style={[styles.box, styles.fallback, { backgroundColor: colors.cardActive }, style]} testID={testID ? `${testID}-fallback` : undefined}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={iconSize} color={colors.primary} />
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: "hidden" },
  fallback: { alignItems: "center", justifyContent: "center", gap: 6 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },
});
