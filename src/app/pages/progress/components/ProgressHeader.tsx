import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = { onCalendarPress: () => void };

export function ProgressHeader({ onCalendarPress }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.text }]}>İlerlemen</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Ne kadar yol kat ettiğini gör.</Text>
      </View>

      <Pressable
        testID="progress-calendar-button"
        onPress={onCalendarPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Aktivite takvimini aç"
        style={[styles.iconButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
      >
        <Ionicons
          name="calendar-outline"
          size={18}
          color={colors.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  textBlock: { flex: 1, paddingRight: 12 },
  title: { fontSize: 26, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 4 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
