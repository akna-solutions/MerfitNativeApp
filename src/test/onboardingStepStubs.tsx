import { useEffect } from "react";
import { Text } from "react-native";

/**
 * Onboarding testleri icin adim taslaklari: her biri ilk render'da gecerli bir deger secer, boylece testler
 * "Devam et" ile son adima hizlica ilerler. Ad/soyad adimlari degerlerini gosterir (on doldurma kontrolu).
 */
function autoSelect<T>(value: T) {
  return function Step(props: { value?: unknown; onChange: (v: T) => void }) {
    useEffect(() => {
      if (props.value === null || props.value === "" || props.value === undefined) props.onChange(value);
    }, []);
    return null;
  };
}

export const NameStep = ({ value }: { value: string }) => <Text>{`ad:${value}`}</Text>;
export const LastNameStep = ({ value }: { value: string }) => <Text>{`soyad:${value}`}</Text>;
export const GenderStep = autoSelect("male");
export const AgeStep = autoSelect("25");
export const WeightStep = autoSelect("78");
export const GoalStep = autoSelect("build_muscle");
export const ActivityStep = autoSelect("moderate");
export const ExperienceStep = autoSelect("beginner");
export const FrequencyStep = autoSelect(3);

export function HeightStep(props: { cmValue: string; onCmChange: (v: string) => void }) {
  useEffect(() => {
    if (!props.cmValue) props.onCmChange("180");
  }, []);
  return null;
}

export function EquipmentStep(props: {
  location: string | null;
  onLocationChange: (v: string) => void;
  onEquipmentChange: (v: string[]) => void;
}) {
  useEffect(() => {
    if (!props.location) {
      props.onLocationChange("home");
      props.onEquipmentChange(["none"]);
    }
  }, []);
  return null;
}
