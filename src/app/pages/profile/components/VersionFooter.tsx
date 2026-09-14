import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

export function VersionFooter() {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.brand, { color: colors.textSecondary }]}>MB FIT</Text>
      <Text style={[styles.version, { color: colors.textSecondary }]}>Sürüm 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", marginTop: 8 },
  brand: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  version: {
    fontSize: 10,
    marginTop: 3,
    opacity: 0.7,
  },
});
