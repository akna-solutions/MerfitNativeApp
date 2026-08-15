import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  date: Date;
  onChangeDay: (direction: -1 | 1) => void;
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DateSelector({ date, onChangeDay }: Props) {
  const today = new Date();
  const isToday = isSameDay(date, today);
  const label = isToday
    ? "Today"
    : date
        .toLocaleDateString("en-US", { month: "short", day: "numeric" })
        .toUpperCase();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChangeDay(-1)}
        hitSlop={10}
        style={styles.arrow}
      >
        <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
      </Pressable>

      <Text style={[styles.label, isToday && styles.labelActive]}>{label}</Text>

      <Pressable
        onPress={() => !isToday && onChangeDay(1)}
        hitSlop={10}
        style={styles.arrow}
        disabled={isToday}
      >
        <Ionicons
          name="chevron-forward"
          size={16}
          color={isToday ? "rgba(255,255,255,0.15)" : colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    minWidth: 90,
    textAlign: "center",
  },
  labelActive: { color: colors.electricBlue },
});
