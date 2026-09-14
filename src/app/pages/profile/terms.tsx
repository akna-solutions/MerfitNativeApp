import { StyleSheet, Text } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useTheme } from "../../../shared/theme/ThemeContext";

export default function TermsRoute() {
  const { colors } = useTheme();

  return (
    <ProfileDetailShell title="Şartlar ve Koşullar">
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        Şartlar ve Koşullar içeriğin burada görünecek.
      </Text>
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 13, lineHeight: 20 },
});
