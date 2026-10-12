import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  name: string;
  /** Okunmamis bildirim sayisi; 0 ise zildeki nokta gosterilmez. */
  unreadCount?: number;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

export function DashboardHeader({ name, unreadCount = 0, onNotificationsPress, onProfilePress }: Props) {
  const { colors } = useTheme();
  const initial = name.trim().charAt(0).toUpperCase() || "M";

  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          {getGreeting()}, {name}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Bugünü değerlendirelim.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onNotificationsPress}
          hitSlop={8}
          style={[styles.bellButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? `Bildirimler, ${unreadCount} okunmamış` : "Bildirimler"}
        >
          <Ionicons
            name="notifications-outline"
            size={19}
            color={colors.text}
          />
          {unreadCount > 0 ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
        </Pressable>
        <Pressable
          onPress={onProfilePress}
          hitSlop={8}
          style={[styles.avatar, { backgroundColor: colors.primaryPressed }]}
          accessibilityRole="button"
          accessibilityLabel="Profil"
        >
          <Text style={styles.avatarLabel}>{initial}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textBlock: { flex: 1, paddingRight: 12 },
  greeting: { fontSize: 21, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 4 },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
