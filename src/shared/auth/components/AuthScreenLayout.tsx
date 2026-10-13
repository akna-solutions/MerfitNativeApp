import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../theme/ThemeContext";

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** Ust ustteki geri butonu; varsayilan: onceki ekrana don, yoksa karsilama ekranina. */
  onBack?: () => void;
  showBack?: boolean;
  /** Basligin ustunde gosterilen durum rozeti (bkz. AuthStatusIcon). */
  icon?: ReactNode;
};

/**
 * Sifremi unuttum / yeni sifre / e-posta dogrulama ekranlarinin ortak iskeleti. LoginScreen ile ayni
 * tasarim dili: geri butonu, buyuk baslik, aciklama, kaydirilabilir icerik ve altta sabit buton alani.
 */
export function AuthScreenLayout({ title, subtitle, children, footer, onBack, showBack = true, icon }: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/pages/welcome");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <View style={styles.header}>
          {showBack ? (
            <Pressable
              onPress={handleBack}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Geri"
              style={[styles.backButton, { backgroundColor: colors.inputBackground }]}
            >
              <Text style={[styles.backLabel, { color: colors.text }]}>←</Text>
            </Pressable>
          ) : (
            <View style={styles.backButton} />
          )}
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          ) : null}
          <View style={styles.body}>{children}</View>
        </ScrollView>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 4 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backLabel: { fontSize: 17, fontWeight: "600" },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 36, paddingBottom: 16 },
  icon: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "700", lineHeight: 34 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 10 },
  body: { marginTop: 28 },
  footer: { paddingHorizontal: 24, paddingBottom: 8, paddingTop: 8, gap: 4 },
});
