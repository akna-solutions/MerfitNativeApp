import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { storeRoutes } from "../navigation";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  right?: ReactNode;
  onBack?: () => void;
  footer?: ReactNode;
  /** Alt kenar guvenli alani; footer yoksa icerik icin uygulanir. */
  testID?: string;
};

/** Store'un yigin (stack) ekranlari icin ortak ust cubuk + guvenli alan. Icerik (liste/scroll) cagirana aittir. */
export function StoreScreenShell({ title, subtitle, children, right, onBack, footer, testID }: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  const goBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace(storeRoutes.home());
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID={testID}>
      <SafeAreaView style={styles.flex} edges={["top", footer ? "bottom" : "left"]}>
        <View style={styles.header}>
          <Pressable
            onPress={goBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Geri"
            style={[styles.iconButton, { backgroundColor: colors.inputBackground }]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <View style={styles.right}>{right}</View>
        </View>
        <View style={styles.flex}>{children}</View>
        {footer ? <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>{footer}</View> : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  titleBlock: { flex: 1 },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 1 },
  right: { minWidth: 36, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
