import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = { onAssistantPress: () => void; onNotificationsPress: () => void };

export function NutritionHeader({ onAssistantPress, onNotificationsPress }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.text }]}>Beslenme</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Gelişimini besle.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          testID="nutrition-assistant-button"
          onPress={onAssistantPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Mbfit Beslenme Asistanı"
          style={[styles.iconButton, { backgroundColor: colors.cardActive, borderColor: colors.borderActive }]}
        >
          <Ionicons name="sparkles" size={18} color={colors.primary} />
        </Pressable>

        <Pressable
          onPress={onNotificationsPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Beslenme bildirimleri"
          style={[styles.iconButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
        >
          <Ionicons
            name="notifications-outline"
            size={18}
            color={colors.text}
          />
        </Pressable>
      </View>
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
  actions: { flexDirection: "row", gap: 10 },
  title: { fontSize: 24, fontWeight: "700" },
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
