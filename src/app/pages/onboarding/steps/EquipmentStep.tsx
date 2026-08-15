import { StyleSheet, Text, View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";
import { colors } from "../theme";
import { Equipment, TrainingLocation } from "../types";

const LOCATION_OPTIONS: { label: string; value: TrainingLocation }[] = [
  { label: "Gym", value: "gym" },
  { label: "Home", value: "home" },
  { label: "Outdoor", value: "outdoor" },
];

const EQUIPMENT_OPTIONS: { label: string; value: Equipment }[] = [
  { label: "Dumbbells", value: "dumbbells" },
  { label: "Barbell", value: "barbell" },
  { label: "Resistance bands", value: "bands" },
  { label: "Machines", value: "machines" },
  { label: "Pull-up bar", value: "pullup_bar" },
  { label: "Kettlebell", value: "kettlebell" },
  { label: "No equipment", value: "none" },
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
          <Text style={styles.equipmentTitle}>What equipment do you have?</Text>
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
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
});
