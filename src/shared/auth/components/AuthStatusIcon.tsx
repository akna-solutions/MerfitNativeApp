import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { useTheme } from "../../theme/ThemeContext";

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  tone?: "primary" | "danger";
};

/** SuccessScreen'deki rozetle ayni sekil: ince cerceveli daire icinde ikon. Dekoratiftir (ekran okuyucudan gizli). */
export function AuthStatusIcon({ name, tone = "primary" }: Props) {
  const { colors } = useTheme();
  const color = tone === "danger" ? colors.danger : colors.primary;
  const background = tone === "danger" ? colors.dangerBackground : colors.cardActive;

  return (
    <View
      style={[styles.badge, { borderColor: color, backgroundColor: background }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons name={name} size={28} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
