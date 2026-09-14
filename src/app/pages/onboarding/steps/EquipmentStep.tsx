import { StyleSheet, Text, View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import { Equipment, TrainingLocation } from "../types";

const LOCATION_OPTIONS: { label: string; value: TrainingLocation }[] = [
  { label: "Spor salonu", value: "gym" },
  { label: "Ev", value: "home" },
  { label: "Açık alan", value: "outdoor" },
];

const EQUIPMENT_OPTIONS: { label: string; value: Equipment }[] = [
  { label: "Dambıl", value: "dumbbells" },
  { label: "Halter", value: "barbell" },
  { label: "Direnç bandı", value: "bands" },
  { label: "Makineler", value: "machines" },
  { label: "Barfiks barı", value: "pullup_bar" },
  { label: "Kettlebell", value: "kettlebell" },
  { label: "Ekipman yok", value: "none" },
];

type Props = {
  location: TrainingLocation | null;
  onLocationChange: (value: TrainingLocation) => void;
  equipment: Equipment[];
  onEquipmentChange: (value: Equipment[]) => void;
};

export function EquipmentStep({
  location,
  onLocationChange,
  equipment,
  onEquipmentChange,
}: Props) {
  const { colors } = useTheme();
  const toggleEquipment = (value: Equipment) => {
    if (value === "none") {
      onEquipmentChange(equipment.includes("none") ? [] : ["none"]);
      return;
    }
    const withoutNone = equipment.filter((item) => item !== "none");
    onEquipmentChange(
      withoutNone.includes(value)
        ? withoutNone.filter((item) => item !== value)
        : [...withoutNone, value],
    );
  };

  return (
    <View>
      {LOCATION_OPTIONS.map((option) => (
        <OnboardingOption
          key={option.value}
          label={option.label}
          selected={location === option.value}
          onPress={() => onLocationChange(option.value)}
        />
      ))}

      {location ? (
        <View style={styles.equipmentBlock}>
          <Text style={[styles.equipmentTitle, { color: colors.text }]}>Hangi ekipmanlara sahipsin?</Text>
          {EQUIPMENT_OPTIONS.map((option) => (
            <OnboardingOption
              key={option.value}
              label={option.label}
              shape="check"
              selected={equipment.includes(option.value)}
              onPress={() => toggleEquipment(option.value)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  equipmentBlock: { marginTop: 24 },
  equipmentTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
});
