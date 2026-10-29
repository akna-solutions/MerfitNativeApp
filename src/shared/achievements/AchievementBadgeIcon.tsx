import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text } from "react-native";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  streak: "flame-outline",
  workouts: "barbell-outline",
  pr: "trophy-outline",
  weekly: "calendar-outline",
};

type Props = { icon: string | null | undefined; size: number; color: string };

/**
 * Rozet simgesi: bilinen kodlar Ionicons'a cevrilir, admin panelinde emoji girildiyse emoji gosterilir,
 * ikisi de yoksa genel rozet simgesi.
 */
export function AchievementBadgeIcon({ icon, size, color }: Props) {
  const mapped = icon ? ICONS[icon] : undefined;
  if (mapped) return <Ionicons name={mapped} size={size} color={color} />;
  if (icon && icon.trim().length > 0 && icon.trim().length <= 8) {
    return <Text style={[styles.emoji, { fontSize: size }]}>{icon.trim()}</Text>;
  }
  return <Ionicons name="ribbon-outline" size={size} color={color} />;
}

const styles = StyleSheet.create({
  emoji: { textAlign: "center" },
});
