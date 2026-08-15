import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = { onNotificationsPress: () => void };

export function NutritionHeader({ onNotificationsPress }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>Nutrition</Text>
        <Text style={styles.subtitle}>Fuel your progress.</Text>
      </View>

      <Pressable
        onPress={onNotificationsPress}
        hitSlop={8}
        style={styles.iconButton}
      >
        <Ionicons
          name="notifications-outline"
          size={18}
          color={colors.textPrimary}
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
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
