import { StyleSheet, TextInput, TextInputProps } from "react-native";

import { colors } from "../theme";

export function OnboardingInput({ style, ...rest }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.electricBlue}
      keyboardAppearance="dark"
      {...rest}
      // style en son birleştirilir ki caller'ın font boyutu gibi override'ları
      // taban stili (renk, arkaplan, yükseklik) SİLMESİN, sadece üstüne eklensin.
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 64,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 20,
    paddingVertical: 0,
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
