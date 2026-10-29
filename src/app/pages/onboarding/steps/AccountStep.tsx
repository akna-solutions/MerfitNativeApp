import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DumbbellSpinner } from "../../../../shared/motion/DumbbellSpinner";

import { OnboardingInput } from "../components/OnboardingInput";
import { GoogleButton } from "../../../../shared/auth/components/GoogleButton";
import { UsernameAvailability } from "../../../../shared/auth/useUsernameAvailability";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  username: string;
  onUsernameChange: (value: string) => void;
  /** Kullanici adinin anlik kontrol sonucu (bkz. useUsernameAvailability). */
  usernameAvailability?: UsernameAvailability;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  onGooglePress: () => void;
  /** Google hesap secici / sunucu kontrolu suruyor. */
  googleLoading?: boolean;
  /**
   * Google ile kayit modunda Google hesabinin e-postasi. Doluyken e-posta ve sifre alanlari gizlenir;
   * yalnizca kullanici adi sorulur.
   */
  googleEmail?: string | null;
  /** Google ile kayit modundan e-posta/sifre ile kayda doner. */
  onUseOtherMethod?: () => void;
  onLoginPress: () => void;
  errorMessage?: string | null;
};

/** Backend'deki RegisterRequest.Username validasyonuyla (RegularExpression) birebir ayni kural. */
const USERNAME_CHARS_REGEX = /^[a-zA-Z0-9_]*$/;

export function AccountStep({
  username,
  onUsernameChange,
  usernameAvailability = { state: "idle" },
  email,
  onEmailChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  onGooglePress,
  googleLoading = false,
  googleEmail,
  onUseOtherMethod,
  onLoginPress,
  errorMessage,
}: Props) {
  const { colors } = useTheme();
  const usernameField = (
    <>
      <OnboardingInput
        value={username}
        onChangeText={(value) => {
          if (USERNAME_CHARS_REGEX.test(value)) {
            onUsernameChange(value);
          }
        }}
        placeholder="Kullanıcı adı"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={30}
        style={[
          styles.fieldFont,
          usernameAvailability.state === "unavailable" ? { borderColor: colors.danger } : null,
        ]}
      />
      <UsernameStatus availability={usernameAvailability} />
    </>
  );

  if (googleEmail) {
    return (
      <View>
        <View style={[styles.googleAccount, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
          <Ionicons name="logo-google" size={18} color={colors.text} />
          <View style={styles.googleAccountText}>
            <Text style={[styles.googleAccountLabel, { color: colors.textSecondary }]}>Google hesabınla kayıt oluyorsun</Text>
            <Text style={[styles.googleAccountEmail, { color: colors.text }]} numberOfLines={1}>{googleEmail}</Text>
          </View>
        </View>
        <View style={styles.gap} />
        {usernameField}

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {onUseOtherMethod ? (
          <Pressable onPress={onUseOtherMethod} hitSlop={8} style={styles.loginRow} accessibilityRole="button">
            <Text style={[styles.loginLink, { color: colors.primary }]}>E-posta ve şifreyle kayıt ol</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      {usernameField}
      <View style={styles.gap} />
      <OnboardingInput
        value={email}
        onChangeText={onEmailChange}
        placeholder="E-posta"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.fieldFont}
      />
      <View style={styles.gap} />
      <OnboardingInput
        value={password}
        onChangeText={onPasswordChange}
        placeholder="Şifre"
        secureTextEntry
        autoCapitalize="none"
        style={styles.fieldFont}
      />
      <View style={styles.gap} />
      <OnboardingInput
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
        placeholder="Şifreyi onayla"
        secureTextEntry
        autoCapitalize="none"
        style={styles.fieldFont}
      />

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerLabel, { color: colors.textSecondary }]}>veya</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <GoogleButton onPress={onGooglePress} loading={googleLoading} />

      <Pressable onPress={onLoginPress} hitSlop={8} style={styles.loginRow}>
        <Text style={[styles.loginText, { color: colors.textSecondary }]}>
          Zaten bir hesabın var mı?{" "}
          <Text style={[styles.loginLink, { color: colors.primary }]}>Giriş yap</Text>
        </Text>
      </Pressable>
    </View>
  );
}

function UsernameStatus({ availability }: { availability: UsernameAvailability }) {
  const { colors } = useTheme();

  if (availability.state === "checking") {
    return (
      <View style={styles.statusRow} accessibilityLiveRegion="polite">
        <DumbbellSpinner size="small" color={colors.textSecondary} />
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>Kontrol ediliyor…</Text>
      </View>
    );
  }

  if (availability.state === "available") {
    return (
      <View style={styles.statusRow} accessibilityLiveRegion="polite">
        <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
        <Text style={[styles.statusText, { color: colors.primary }]}>Kullanıcı adı uygun</Text>
      </View>
    );
  }

  if (availability.state === "unavailable") {
    return (
      <View style={styles.statusRow} accessibilityLiveRegion="polite">
        <Ionicons name="close-circle" size={16} color={colors.danger} />
        <Text style={[styles.statusText, { color: colors.danger }]}>{availability.message}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, paddingHorizontal: 4 },
  statusText: { fontSize: 13, fontWeight: "600", flexShrink: 1 },
  fieldFont: { fontSize: 16, fontWeight: "600" },
  gap: { height: 12 },
  errorText: {
    color: "#FF6B6B",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 14,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerLabel: {
    fontSize: 12,
    marginHorizontal: 12,
  },
  googleAccount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  googleAccountText: { flex: 1 },
  googleAccountLabel: { fontSize: 12, fontWeight: "600" },
  googleAccountEmail: { fontSize: 15, fontWeight: "700", marginTop: 2 },
  loginRow: { marginTop: 22, alignItems: "center" },
  loginText: { fontSize: 13 },
  loginLink: { fontWeight: "700" },
});
