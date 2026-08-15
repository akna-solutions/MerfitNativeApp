import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WelcomeButton } from "./WelcomeButton";
import { colors } from "../theme";

// MERFIT logosu asset olarak eklendiğinde (örn. assets/images/merfit-logo.png)
// aşağıdaki <Text> wordmark'ı <Image source={require("@/assets/images/merfit-logo.png")} /> ile değiştir.

type Props = {
  onGetStarted: () => void;
  onLogin: () => void;
};

export function WelcomeContent({ onGetStarted, onLogin }: Props) {
  const logoAnim = useRef(new Animated.Value(0)).current;
  const headlineAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(140, [
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headlineAnim, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.timing(ctaAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [ctaAnim, headlineAnim, logoAnim]);

  const rise = (anim: Animated.Value, distance: number) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Animated.View style={[styles.logoBlock, rise(logoAnim, -10)]}>
        <Text style={styles.logoText}>MERFIT</Text>
        <Text style={styles.slogan}>TRAIN SMARTER. LIVE BETTER.</Text>
      </Animated.View>

      <View style={styles.spacer} />

      <View style={styles.bottomBlock}>
        <Animated.View style={rise(headlineAnim, 16)}>
          <Text style={styles.headline}>
            Train smarter.{"\n"}Become{" "}
            <Text style={styles.headlineAccent}>stronger</Text>.
          </Text>
        </Animated.View>

        <Animated.View style={rise(ctaAnim, 16)}>
          <WelcomeButton
            label="GET STARTED"
            onPress={onGetStarted}
            variant="primary"
          />
          <View style={styles.ctaGap} />
          <WelcomeButton
            label="I ALREADY HAVE AN ACCOUNT"
            onPress={onLogin}
            variant="secondary"
          />
          <Text style={styles.footer}>Your journey starts here.</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  logoBlock: { alignItems: "center", marginTop: 28 },
  logoText: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 4,
  },
  slogan: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 2.4,
    marginTop: 8,
  },
  spacer: { flex: 1 },
  bottomBlock: { paddingBottom: 8 },
  headline: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 36,
    marginBottom: 28,
  },
  headlineAccent: { color: colors.electricBlue },
  ctaGap: { height: 12 },
  footer: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.3,
    textAlign: "center",
    marginTop: 14,
  },
});
