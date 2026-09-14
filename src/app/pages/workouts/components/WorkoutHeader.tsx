import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

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
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.text }]}>Antrenmanlar</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Bir sonraki mücadeleni bul.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onSearchPress}
          style={[styles.iconButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
          hitSlop={8}
        >
          <Ionicons
            name="search-outline"
            size={19}
            color={colors.text}
          />
        </Pressable>
        <Pressable
          onPress={onFilterPress}
          style={[styles.iconButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
          hitSlop={8}
        >
          <Ionicons
            name="options-outline"
            size={19}
            color={colors.text}
          />
          {filtersActive ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
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
  title: { fontSize: 26, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 4 },
  actions: { flexDirection: "row", gap: 10 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
