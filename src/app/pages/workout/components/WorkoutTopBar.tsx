import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  title: string;
  exerciseIndex: number;
  totalExercises: number;
  onClose: () => void;
  onPause: () => void;
};

export function WorkoutTopBar({
  title,
  exerciseIndex,
  totalExercises,
  onClose,
  onPause,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Pressable onPress={onClose} hitSlop={12} style={[styles.iconButton, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name="close" size={20} color={colors.text} />
      </Pressable>

      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title.toUpperCase()}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Egzersiz {exerciseIndex + 1} / {totalExercises}
        </Text>
      </View>

      <Pressable onPress={onPause} hitSlop={12} style={[styles.iconButton, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name="pause" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  title: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  subtitle: { fontSize: 11, marginTop: 3 },
});
