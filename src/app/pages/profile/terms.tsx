import { StyleSheet, Text } from "react-native";

import { ProfileDetailShell } from "../../../shared/profile/components/ProfileDetailShell";
import { colors } from "./theme";

export default function TermsRoute() {
  return (
    <ProfileDetailShell title="Terms & Conditions">
      <Text style={styles.text}>
        Your Terms & Conditions content will appear here.
      </Text>
    </ProfileDetailShell>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
});
