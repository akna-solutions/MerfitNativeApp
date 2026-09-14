import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/ThemeContext";
import { PlusBadge } from "./PlusBadge";

type Props = {
  title: string;
  description: string;
};

export function LockedOverlay({ title, description }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.overlay}>
      <View style={styles.lockCircle}>
        <Ionicons name="lock-closed" size={16} color={colors.primary} />
      </View>
      <View style={styles.badgeGap}>
        <PlusBadge />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      <Text style={[styles.cta, { color: colors.primary }]}>Plus'ı Görüntüle</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.68)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  lockCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,168,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(0,168,255,0.4)",
  },
  badgeGap: { marginTop: 10 },
  title: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 16,
  },
  cta: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 10,
  },
});
