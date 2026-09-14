import { StyleSheet, Text } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { useTheme } from "../../../shared/theme/ThemeContext";

export default function PrivacyPolicyRoute() {
  const { colors } = useTheme();

  return (
    <ProfileDetailShell title="Gizlilik Politikası">
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        Gizlilik Politikası içeriğin burada görünecek.
      </Text>
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 13, lineHeight: 20 },
});
