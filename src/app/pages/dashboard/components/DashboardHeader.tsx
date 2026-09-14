import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  name: string;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

export function DashboardHeader({ name }: Props) {
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
        <View style={[styles.bellButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <Ionicons
            name="notifications-outline"
            size={19}
            color={colors.text}
          />
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primaryPressed }]}>
          <Text style={styles.avatarLabel}>{initial}</Text>
        </View>
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
