import { StyleSheet, Text, View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import { TrainingLocation } from "../types";

const LOCATION_OPTIONS: { label: string; value: TrainingLocation }[] = [
  { label: "Spor salonu", value: "gym" },
  { label: "Ev", value: "home" },
  { label: "Açık alan", value: "outdoor" },
];

type Props = {
  location: TrainingLocation | null;
  onLocationChange: (value: TrainingLocation) => void;
  /** Ekipmanli (tum ekipmanlar) / ekipmansiz (vucut agirligi). Spor salonunda her zaman true. */
  hasEquipment: boolean | null;
  onHasEquipmentChange: (value: boolean) => void;
};

/**
 * Antrenman yeri ve ekipman durumu. Ekipmanlar tek tek secilmez: "Ekipmanli" tum ekipmanlara erisim,
 * "Ekipmansiz" yalnizca vucut agirligi demektir. Spor salonunda ekipman sorulmaz.
 */
export function EquipmentStep({ location, onLocationChange, hasEquipment, onHasEquipmentChange }: Props) {
  const { colors } = useTheme();

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

      {location === "gym" ? (
        <View style={styles.equipmentBlock}>
          <Text style={[styles.gymNote, { color: colors.text }]}>
            Spor salonunda tüm ekipmanlara erişimin olduğunu varsayıyoruz.
          </Text>
        </View>
      ) : location ? (
        <View style={styles.equipmentBlock}>
          <Text style={[styles.equipmentTitle, { color: colors.text }]}>Ekipmanın var mı?</Text>
          <OnboardingOption
            label="Ekipmanlı"
            subtitle="Dambıl, bant, bar gibi ekipmanlarla çalışırım."
            selected={hasEquipment === true}
            onPress={() => onHasEquipmentChange(true)}
          />
          <OnboardingOption
            label="Ekipmansız"
            subtitle="Yalnızca vücut ağırlığıyla çalışırım."
            selected={hasEquipment === false}
            onPress={() => onHasEquipmentChange(false)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  equipmentBlock: { marginTop: 24 },
  gymNote: { fontSize: 14, lineHeight: 20 },
  equipmentTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
});
