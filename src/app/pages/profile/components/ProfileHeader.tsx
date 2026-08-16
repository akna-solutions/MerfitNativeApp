import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

export function ProfileHeader() {
  return (
    <View>
      <Text style={styles.title}>Profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: "700" },
});
