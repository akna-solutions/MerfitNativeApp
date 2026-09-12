import { ReactNode, useEffect, useRef } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../theme";
import { OnboardingButton } from "./OnboardingButton";
import { ProgressBar } from "./ProgressBar";

type Props = {
  step: number;
  totalSteps: number;
  title: string;
  description?: string;
  children: ReactNode;
  onBack: () => void;
  onContinue: () => void;
  onSkip?: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
  continueLoading?: boolean;
};

export function OnboardingScreen({
  step,
  totalSteps,
  title,
  description,
  children,
  onBack,
  onContinue,
  onSkip,
  continueDisabled,
  continueLabel = "Devam et",
  continueLoading,
}: Props) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [step, fade]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
              <Text style={styles.backLabel}>←</Text>
            </Pressable>
          </View>
          <ProgressBar current={step} total={totalSteps} />
          <Text style={styles.stepLabel}>
            Adım {step} / {totalSteps}
          </Text>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.body,
              {
                opacity: fade,
                transform: [
                  {
                    translateX: fade.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.title}>{title}</Text>
            {description ? (
              <Text style={styles.description}>{description}</Text>
            ) : null}
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <OnboardingButton
            label={continueLabel}
            onPress={onContinue}
            disabled={continueDisabled}
            isLoading={continueLoading}
          />
          {onSkip ? (
            <OnboardingButton
              label="Şimdilik atla"
              onPress={onSkip}
              variant="text"
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 4 },
  headerTopRow: { marginBottom: 18 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  backLabel: { color: colors.textPrimary, fontSize: 17, fontWeight: "600" },
  stepLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.4,
    marginTop: 8,
  },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  body: { paddingTop: 28, paddingBottom: 24 },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  content: { marginTop: 28 },
  footer: { paddingHorizontal: 24, paddingBottom: 8, paddingTop: 8 },
});
