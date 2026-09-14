import { StyleSheet, Text, View } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useTheme } from "../../../shared/theme/ThemeContext";

export default function AboutRoute() {
  const { colors } = useTheme();

  return (
    <ProfileDetailShell title="MB FIT Hakkında">
      <View style={styles.center}>
        <Text style={[styles.brand, { color: colors.primary }]}>MB FIT</Text>
        <Text style={[styles.tagline, { color: colors.text }]}>
          Daha akıllı antrenman yap.{"\n"}Daha ileri git.
        </Text>
        <Text style={[styles.version, { color: colors.textSecondary }]}>Sürüm 1.0.0</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Her gün daha iyi olmak isteyenler için tasarlandı.
        </Text>
      </View>
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", paddingTop: 32 },
  brand: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
  version: { fontSize: 12, marginTop: 14 },
  description: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 19,
    paddingHorizontal: 16,
  },
});
