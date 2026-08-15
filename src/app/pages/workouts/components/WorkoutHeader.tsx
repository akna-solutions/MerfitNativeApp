import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  onSearchPress: () => void;
  onFilterPress: () => void;
  filtersActive?: boolean;
};

export function WorkoutHeader({
  onSearchPress,
  onFilterPress,
  filtersActive,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>Workouts</Text>
        <Text style={styles.subtitle}>Find your next challenge.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onSearchPress}
          style={styles.iconButton}
          hitSlop={8}
        >
          <Ionicons
            name="search-outline"
            size={19}
            color={colors.textPrimary}
          />
        </Pressable>
        <Pressable
          onPress={onFilterPress}
          style={styles.iconButton}
          hitSlop={8}
        >
          <Ionicons
            name="options-outline"
            size={19}
            color={colors.textPrimary}
          />
          {filtersActive ? <View style={styles.dot} /> : null}
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
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  actions: { flexDirection: "row", gap: 10 },
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
  dot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.electricBlue,
  },
});
