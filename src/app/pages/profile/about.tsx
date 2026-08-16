import { StyleSheet, Text, View } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { colors } from "./theme";

export default function AboutRoute() {
  return (
    <ProfileDetailShell title="About MERFIT">
      <View style={styles.center}>
        <Text style={styles.brand}>MERFIT</Text>
        <Text style={styles.tagline}>
          Train smarter.{"\n"}Progress further.
        </Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.description}>
          Made for people who want to become better every day.
        </Text>
      </View>
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", paddingTop: 32 },
  brand: {
    color: colors.electricBlue,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  tagline: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
  version: { color: colors.textMuted, fontSize: 12, marginTop: 14 },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 19,
    paddingHorizontal: 16,
  },
});
