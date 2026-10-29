import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

export function EmptyState({ icon, title, message, actionLabel, onAction, testID }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap} testID={testID}>
      <View style={[styles.iconWrap, { backgroundColor: colors.cardActive }]}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={styles.buttonLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 48, gap: 10 },
  iconWrap: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  title: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  message: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  button: { marginTop: 12, paddingHorizontal: 22, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  buttonLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
