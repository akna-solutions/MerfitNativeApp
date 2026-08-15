import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  label: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  /** Kare check yerine yuvarlak tik göstermek istersen (multi-select equipment gibi) */
  shape?: "radio" | "check";
};

export function OnboardingOption({
  label,
  subtitle,
  selected,
  onPress,
  shape = "radio",
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardActive]}
    >
      <View style={styles.textBlock}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View
        style={[
          styles.indicator,
          shape === "check" && styles.indicatorSquare,
          selected && styles.indicatorActive,
        ]}
      >
        {selected ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    marginBottom: 10,
  },
  cardActive: {
    borderColor: colors.cardBorderActive,
    backgroundColor: colors.cardBackgroundActive,
  },
  textBlock: { flex: 1, paddingRight: 12 },
  label: { color: colors.textPrimary, fontSize: 15, fontWeight: "600" },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorSquare: { borderRadius: 6 },
  indicatorActive: {
    borderColor: colors.electricBlue,
    backgroundColor: colors.electricBlue,
  },
  checkmark: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
});
