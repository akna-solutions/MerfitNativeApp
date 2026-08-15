import { OnboardingInput } from "../components/OnboardingInput";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function NameStep({ value, onChange }: Props) {
  return (
    <OnboardingInput
      value={value}
      onChangeText={onChange}
      placeholder="Your first name"
      autoFocus
      autoCapitalize="words"
      autoCorrect={false}
      returnKeyType="done"
      style={{ fontSize: 20 }}
    />
  );
}
