import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  totalSets: number;
  currentSet: number; // 1-indexed
  completedCount: number;
};

export function SetTracker({ totalSets, currentSet, completedCount }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSets }).map((_, index) => {
        const setNumber = index + 1;
        const isDone = setNumber <= completedCount;
        const isCurrent = !isDone && setNumber === currentSet;

        return (
          <View
            key={setNumber}
            style={[
              styles.dot,
              { backgroundColor: colors.inputBackground },
              isDone && { backgroundColor: colors.primary },
              isCurrent && {
                backgroundColor: "transparent",
                borderWidth: 1.5,
                borderColor: colors.primary,
              },
            ]}
          >
            {isDone ? (
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.dotLabel,
                  { color: colors.textSecondary },
                  isCurrent && { color: colors.primary },
                ]}
              >
                {setNumber}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 18,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dotLabel: { fontSize: 12, fontWeight: "700" },
});
