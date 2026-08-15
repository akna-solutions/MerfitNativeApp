import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  name: string;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({ name }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || "M";

  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={styles.greeting}>
          {getGreeting()}, {name}
        </Text>
        <Text style={styles.subtitle}>Let's make today count.</Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.bellButton}>
          <Ionicons
            name="notifications-outline"
            size={19}
            color={colors.textPrimary}
          />
          <View style={styles.dot} />
        </View>
        <View style={styles.avatar}>
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
  greeting: { color: colors.textPrimary, fontSize: 21, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.electricBlue,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.buttonElectricBlue,
  },
  avatarLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
