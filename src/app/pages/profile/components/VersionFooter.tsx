import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

export function VersionFooter() {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.brand}>MB FIT</Text>
      <Text style={styles.version}>Sürüm 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", marginTop: 8 },
  brand: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  version: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 3,
    opacity: 0.7,
  },
});
