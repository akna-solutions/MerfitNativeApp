import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

export function ProfileHeader() {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.title, { color: colors.text }]}>Profil</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "700" },
});
