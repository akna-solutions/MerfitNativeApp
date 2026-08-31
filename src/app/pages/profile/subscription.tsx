import { StyleSheet, Text } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { colors } from "./theme";

export default function PrivacyPolicyRoute() {
  return (
    <ProfileDetailShell title="Gizlilik Politikası">
      <Text style={styles.text}>
        Gizlilik Politikası içeriğin burada görünecek.
      </Text>
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
});
