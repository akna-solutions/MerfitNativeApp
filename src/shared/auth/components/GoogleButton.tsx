import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";
import { DumbbellSpinner } from "../../motion/DumbbellSpinner";

import { useTheme } from "../../theme/ThemeContext";

type Props = {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

/** Giris ekrani ve onboarding'in hesap adimindaki "Google ile devam et" butonu. */
export function GoogleButton({ onPress, loading = false, disabled = false }: Props) {
  const { colors } = useTheme();
  const inactive = loading || disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel="Google ile devam et"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.button,
        { borderColor: colors.border, backgroundColor: colors.inputBackground },
        disabled && !loading ? styles.disabled : null,
      ]}
    >
      {loading ? (
        <DumbbellSpinner color={colors.text} />
      ) : (
        <>
          <Ionicons name="logo-google" size={18} color={colors.text} />
          <Text style={[styles.label, { color: colors.text }]}>Google ile devam et</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  label: { fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.5 },
});
