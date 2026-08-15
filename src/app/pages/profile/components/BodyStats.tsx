import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  height: number;
  weight: number;
  age: number;
  onEditPress: () => void;
};

export function BodyStats({ height, weight, age, onEditPress }: Props) {
  const bmi = height > 0 ? weight / Math.pow(height / 100, 2) : 0;

  const items = [
    { label: "Height", value: `${height}`, unit: "cm" },
    { label: "Weight", value: `${weight}`, unit: "kg" },
    { label: "Age", value: `${age}`, unit: "" },
    { label: "BMI", value: bmi.toFixed(1), unit: "" },
  ];

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <Pressable onPress={onEditPress} hitSlop={8}>
          <Text style={styles.edit}>Edit</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.label} style={styles.card}>
            <Text style={styles.label}>{item.label}</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>{item.value}</Text>
              {item.unit ? <Text style={styles.unit}> {item.unit}</Text> : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  edit: { color: colors.electricBlue, fontSize: 12, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  valueRow: { flexDirection: "row", alignItems: "baseline", marginTop: 8 },
  value: { color: colors.textPrimary, fontSize: 20, fontWeight: "700" },
  unit: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
});
