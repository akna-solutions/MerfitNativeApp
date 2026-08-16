import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { PlusBadge } from "./PlusBadge";

type Props = {
  title: string;
  description: string;
};

export function LockedOverlay({ title, description }: Props) {
  return (
    <View style={styles.overlay}>
      <View style={styles.lockCircle}>
        <Ionicons name="lock-closed" size={16} color={colors.electricBlue} />
      </View>
      <View style={styles.badgeGap}>
        <PlusBadge />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.cta}>View Plus</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
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
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
  },
  description: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 16,
  },
  cta: {
    color: colors.electricBlue,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 10,
  },
});
