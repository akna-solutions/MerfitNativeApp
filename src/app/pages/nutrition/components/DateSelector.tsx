import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

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
  const { colors } = useTheme();
  const today = new Date();
  const isToday = isSameDay(date, today);
  const label = isToday
    ? "Bugün"
    : date
        .toLocaleDateString("tr-TR", { month: "short", day: "numeric" })
        .toUpperCase();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChangeDay(-1)}
        hitSlop={10}
        style={[styles.arrow, { backgroundColor: colors.inputBackground }]}
      >
        <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
      </Pressable>

      <Text style={[styles.label, { color: colors.textSecondary }, isToday && { color: colors.primary }]}>{label}</Text>

      <Pressable
        onPress={() => !isToday && onChangeDay(1)}
        hitSlop={10}
        style={[styles.arrow, { backgroundColor: colors.inputBackground }]}
        disabled={isToday}
      >
        <Ionicons
          name="chevron-forward"
          size={16}
          color={isToday ? colors.border : colors.textSecondary}
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
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    minWidth: 90,
    textAlign: "center",
  },
});
