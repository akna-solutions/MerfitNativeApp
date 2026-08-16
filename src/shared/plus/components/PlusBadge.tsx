import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = { unlocked?: boolean };

export function PlusBadge({ unlocked }: Props) {
  return (
    <View style={[styles.badge, unlocked && styles.badgeUnlocked]}>
      <Text style={styles.label}>{unlocked ? "✓ PLUS" : "PLUS"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5,5,5,0.4)",
    borderWidth: 1,
    borderColor: colors.electricBlue,
  },
  badgeUnlocked: { borderColor: "rgba(0,168,255,0.4)" },
  label: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
