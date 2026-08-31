import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

const SEGMENT_LITERS = 0.5;

type Props = {
  consumedL: number;
  targetL: number;
  onAdd: () => void;
};

export function WaterTracker({ consumedL, targetL, onAdd }: Props) {
  const totalSegments = Math.max(1, Math.round(targetL / SEGMENT_LITERS));
  const filledSegments = Math.min(
    totalSegments,
    Math.round(consumedL / SEGMENT_LITERS),
  );

  return (
    <View>
      <Text style={styles.sectionTitle}>Su</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          {Array.from({ length: totalSegments }).map((_, index) => (
            <Pressable key={index} onPress={onAdd} hitSlop={4}>
              <Ionicons
                name={index < filledSegments ? "water" : "water-outline"}
                size={20}
                color={
                  index < filledSegments
                    ? colors.electricBlue
                    : colors.textMuted
                }
              />
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.amount}>
            {consumedL.toFixed(1)} / {targetL.toFixed(1)} L
          </Text>
          <Pressable onPress={onAdd} style={styles.addButton} hitSlop={8}>
            <Text style={styles.addLabel}>+ 250 ml</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  amount: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  addButton: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardBackgroundActive,
  },
  addLabel: { color: colors.electricBlue, fontSize: 12, fontWeight: "700" },
});
