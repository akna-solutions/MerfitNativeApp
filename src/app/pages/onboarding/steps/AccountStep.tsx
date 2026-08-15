import { Pressable, StyleSheet, Text, View } from "react-native";

import { OnboardingInput } from "../components/OnboardingInput";
import { colors } from "../theme";

type Props = {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  onGooglePress: () => void;
  onLoginPress: () => void;
};

export function AccountStep({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  onGooglePress,
  onLoginPress,
}: Props) {
  return (
    <View>
      <OnboardingInput
        value={email}
        onChangeText={onEmailChange}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.fieldFont}
      />
      <View style={styles.gap} />
      <OnboardingInput
        value={password}
        onChangeText={onPasswordChange}
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
        style={styles.fieldFont}
      />
      <View style={styles.gap} />
      <OnboardingInput
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
        placeholder="Confirm password"
        secureTextEntry
        autoCapitalize="none"
        style={styles.fieldFont}
      />

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable onPress={onGooglePress} style={styles.googleButton}>
        <Text style={styles.googleLabel}>Continue with Google</Text>
      </Pressable>

      <Pressable onPress={onLoginPress} hitSlop={8} style={styles.loginRow}>
        <Text style={styles.loginText}>
          Already have an account? <Text style={styles.loginLink}>Log in</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldFont: { fontSize: 16, fontWeight: "600" },
  gap: { height: 12 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginHorizontal: 12,
  },
  googleButton: {
    height: 56,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  googleLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: "600" },
  loginRow: { marginTop: 22, alignItems: "center" },
  loginText: { color: colors.textMuted, fontSize: 13 },
  loginLink: { color: colors.electricBlue, fontWeight: "700" },
});
