import { OnboardingInput } from "../components/OnboardingInput";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function AgeStep({ value, onChange }: Props) {
  return (
    <OnboardingInput
      value={value}
      onChangeText={(text) => onChange(text.replace(/[^0-9]/g, "").slice(0, 3))}
      placeholder="25"
      keyboardType="number-pad"
      autoFocus
      maxLength={3}
    />
  );
}
