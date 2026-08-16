import { StyleSheet, Text } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { colors } from "./theme";

export default function PrivacyPolicyRoute() {
  return (
    <ProfileDetailShell title="Privacy Policy">
      <Text style={styles.text}>
        Your Privacy Policy content will appear here.
      </Text>
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
});
