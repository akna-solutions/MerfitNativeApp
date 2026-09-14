import { StyleSheet, TextInput, TextInputProps } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

export function OnboardingInput({ style, ...rest }: TextInputProps) {
  const { colors, isDark } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      selectionColor={colors.primary}
      keyboardAppearance={isDark ? "dark" : "light"}
      {...rest}
      // style en son birleştirilir ki caller'ın font boyutu gibi override'ları
      // taban stili (renk, arkaplan, yükseklik) SİLMESİN, sadece üstüne eklensin.
      style={[
        styles.input,
        { borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 64,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingVertical: 0,
    fontSize: 26,
    fontWeight: "700",
  },
});
