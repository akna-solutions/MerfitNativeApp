import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

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
  return (
    <View style={styles.row}>
      <Pressable onPress={onClose} hitSlop={12} style={styles.iconButton}>
        <Ionicons name="close" size={20} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title.toUpperCase()}
        </Text>
        <Text style={styles.subtitle}>
          Egzersiz {exerciseIndex + 1} / {totalExercises}
        </Text>
      </View>

      <Pressable onPress={onPause} hitSlop={12} style={styles.iconButton}>
        <Ionicons name="pause" size={18} color={colors.textPrimary} />
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
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  titleBlock: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  title: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  subtitle: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
});
