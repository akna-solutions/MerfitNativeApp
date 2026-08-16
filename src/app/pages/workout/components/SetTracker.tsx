import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  totalSets: number;
  currentSet: number; // 1-indexed
  completedCount: number;
};

export function SetTracker({ totalSets, currentSet, completedCount }: Props) {
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
              isDone && styles.dotDone,
              isCurrent && styles.dotCurrent,
            ]}
          >
            {isDone ? (
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            ) : (
              <Text
                style={[styles.dotLabel, isCurrent && styles.dotLabelCurrent]}
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
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  dotDone: { backgroundColor: colors.electricBlue },
  dotCurrent: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.electricBlue,
  },
  dotLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  dotLabelCurrent: { color: colors.electricBlue },
});
