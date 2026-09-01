import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../theme";
import { OnboardingButton } from "./OnboardingButton";

type Props = {
  name: string;
  onStart: () => void;
};

export function SuccessScreen({ name, onStart }: Props) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.spacer} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fade,
            transform: [
              {
                translateY: fade.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeCheck}>✓</Text>
        </View>

        <Text style={styles.title}>
          Hazırsın{name ? `, ${name}` : ""}.
        </Text>
        <Text style={styles.subtitle}>MERFIT yolculuğun şimdi başlıyor.</Text>
        <Text style={styles.description}>
          Antrenman deneyimini kişiselleştirmek için profilini kullanacağız.
        </Text>
      </Animated.View>

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <OnboardingButton label="Antrenmana Başla" onPress={onStart} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  spacer: { flex: 1 },
  content: { alignItems: "center" },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: colors.electricBlue,
    backgroundColor: colors.cardBackgroundActive,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  badgeCheck: { color: colors.electricBlue, fontSize: 26, fontWeight: "700" },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 16,
  },
  footer: { paddingBottom: 8 },
});
