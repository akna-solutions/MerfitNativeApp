import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { OrderStatus } from "../types";
import { ORDER_STATUS_LABELS } from "./labels";

export function StatusPill({ status }: { status: OrderStatus }) {
  const { colors } = useTheme();
  const delivered = status === "delivered";
  return (
    <View style={[styles.pill, { backgroundColor: delivered ? colors.inputBackground : colors.cardActive }]} testID={`status-${status}`}>
      <Text style={[styles.label, { color: delivered ? colors.textSecondary : colors.primary }]}>{ORDER_STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  label: { fontSize: 11, fontWeight: "700" },
});
