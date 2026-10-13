import { Pressable, StyleSheet, Text, View } from "react-native";

import { OnboardingOption } from "../components/OnboardingOption";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import { EquipmentListItem } from "../../../../services/api/types";
import { EquipmentSelection, TrainingLocation } from "../types";

const LOCATION_OPTIONS: { label: string; value: TrainingLocation }[] = [
  { label: "Spor salonu", value: "gym" },
  { label: "Ev", value: "home" },
  { label: "Açık alan", value: "outdoor" },
];

export type EquipmentLoadStatus = "loading" | "ready" | "error";

type Props = {
  location: TrainingLocation | null;
  onLocationChange: (value: TrainingLocation) => void;
  /** GET /api/equipment'ten gelen liste; secenekler sabit kodlanmaz, buradan uretilir. */
  options: EquipmentListItem[];
  status: EquipmentLoadStatus;
  onRetry: () => void;
  equipment: EquipmentSelection[];
  onEquipmentChange: (value: EquipmentSelection[]) => void;
};

export function EquipmentStep({
  location,
  onLocationChange,
  options,
  status,
  onRetry,
  equipment,
  onEquipmentChange,
}: Props) {
  const { colors } = useTheme();
  const toggleEquipment = (value: EquipmentSelection) => {
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

      {location === "gym" ? (
        <View style={styles.equipmentBlock}>
          <Text style={[styles.gymNote, { color: colors.text }]}>
            Spor salonunda tüm ekipmanlara erişimin olduğunu varsayıyoruz.
          </Text>
          {status === "error" ? (
            <Pressable onPress={onRetry}>
              <Text style={{ color: colors.text }}>
                Ekipman listesi alınamadı. Tekrar denemek için dokun.
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : location ? (
        <View style={styles.equipmentBlock}>
          <Text style={[styles.equipmentTitle, { color: colors.text }]}>Hangi ekipmanlara sahipsin?</Text>
          {status === "loading" ? (
            <Text style={{ color: colors.text }}>Ekipman listesi yükleniyor...</Text>
          ) : null}
          {status === "error" ? (
            <Pressable onPress={onRetry}>
              <Text style={{ color: colors.text }}>
                Ekipman listesi alınamadı. Tekrar denemek için dokun.
              </Text>
            </Pressable>
          ) : null}
          {options.map((option) => (
            <OnboardingOption
              key={option.id}
              label={option.name}
              shape="check"
              selected={equipment.includes(option.id)}
              onPress={() => toggleEquipment(option.id)}
            />
          ))}
          <OnboardingOption
            label="Ekipman yok"
            shape="check"
            selected={equipment.includes("none")}
            onPress={() => toggleEquipment("none")}
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
