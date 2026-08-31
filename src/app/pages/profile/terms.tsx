import { StyleSheet, Text } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { colors } from "./theme";

export default function TermsRoute() {
  return (
    <ProfileDetailShell title="Şartlar ve Koşullar">
      <Text style={styles.text}>
        Şartlar ve Koşullar içeriğin burada görünecek.
      </Text>
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
});
