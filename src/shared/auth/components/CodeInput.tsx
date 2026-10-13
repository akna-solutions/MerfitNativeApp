import { StyleSheet, TextInputProps } from "react-native";

import { OnboardingInput } from "../../../app/pages/onboarding/components/OnboardingInput";

export const CODE_LENGTH = 6;

type Props = Omit<TextInputProps, "value" | "onChangeText"> & {
  value: string;
  onChangeText: (code: string) => void;
};

/**
 * E-postayla gelen 6 haneli kodun giris alani. Yalnizca rakam kabul eder (yapistirilan "123 456" gibi
 * degerlerden de rakamlari alir); iOS/Android klavyesi kodu e-postadan otomatik onerebilir.
 */
export function CodeInput({ value, onChangeText, style, ...rest }: Props) {
  return (
    <OnboardingInput
      value={value}
      onChangeText={(text) => onChangeText(text.replace(/\D/g, "").slice(0, CODE_LENGTH))}
      placeholder="••••••"
      keyboardType="number-pad"
      inputMode="numeric"
      textContentType="oneTimeCode"
      autoComplete="one-time-code"
      autoCorrect={false}
      maxLength={CODE_LENGTH + 2}
      accessibilityLabel="6 haneli kod"
      {...rest}
      style={[styles.code, style]}
    />
  );
}

const styles = StyleSheet.create({
  code: { textAlign: "center", letterSpacing: 10, fontSize: 26, fontWeight: "800" },
});
