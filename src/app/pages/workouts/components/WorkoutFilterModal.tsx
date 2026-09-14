import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OnboardingButton } from "../../onboarding/components/OnboardingButton";
import { OnboardingOption } from "../../onboarding/components/OnboardingOption";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import {
    Difficulty,
    DurationRange,
    EMPTY_FILTERS,
    Equipment,
    MuscleGroup,
    WorkoutFilters,
} from "../types";

const DIFFICULTY_OPTIONS: Difficulty[] = [
  "Başlangıç",
  "Orta",
  "İleri",
];
const DURATION_OPTIONS: { label: string; value: DurationRange }[] = [
  { label: "20 dk altı", value: "under20" },
  { label: "20 - 40 dk", value: "20to40" },
  { label: "40+ dk", value: "40plus" },
];
const EQUIPMENT_OPTIONS: Equipment[] = [
  "Ekipman yok",
  "Dambıl",
  "Halter",
  "Makineler",
  "Direnç bandı",
];
const MUSCLE_GROUP_OPTIONS: MuscleGroup[] = [
  "Tüm Vücut",
  "Üst Vücut",
  "Alt Vücut",
  "Core",
];

type Props = {
  visible: boolean;
  filters: WorkoutFilters;
  onApply: (filters: WorkoutFilters) => void;
  onClose: () => void;
};

export function WorkoutFilterModal({
  visible,
  filters,
  onApply,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState<WorkoutFilters>(filters);

  // Modal her açıldığında dışarıdaki mevcut filtrelerle senkronize başla.
  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <SafeAreaView style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]} edges={["bottom"]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Antrenmanları Filtrele</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={[styles.closeButton, { backgroundColor: colors.inputBackground }]}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Zorluk</Text>
            {DIFFICULTY_OPTIONS.map((option) => (
              <OnboardingOption
                key={option}
                label={option}
                selected={draft.difficulty.includes(option)}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    difficulty: toggle(prev.difficulty, option),
                  }))
                }
              />
            ))}

            <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Süre</Text>
            {DURATION_OPTIONS.map((option) => (
              <OnboardingOption
                key={option.value}
                label={option.label}
                selected={draft.duration.includes(option.value)}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    duration: toggle(prev.duration, option.value),
                  }))
                }
              />
            ))}

            <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Ekipman</Text>
            {EQUIPMENT_OPTIONS.map((option) => (
              <OnboardingOption
                key={option}
                label={option}
                shape="check"
                selected={draft.equipment.includes(option)}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    equipment: toggle(prev.equipment, option),
                  }))
                }
              />
            ))}

            <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Kas Grubu</Text>
            {MUSCLE_GROUP_OPTIONS.map((option) => (
              <OnboardingOption
                key={option}
                label={option}
                shape="check"
                selected={draft.muscleGroup.includes(option)}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    muscleGroup: toggle(prev.muscleGroup, option),
                  }))
                }
              />
            ))}

            <View style={styles.scrollBottomSpace} />
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable onPress={() => setDraft(EMPTY_FILTERS)} hitSlop={8}>
              <Text style={[styles.clearLabel, { color: colors.textSecondary }]}>Tümünü temizle</Text>
            </Pressable>
            <View style={styles.applyButton}>
              <OnboardingButton
                label="Filtreleri Uygula"
                onPress={() => onApply(draft)}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    maxHeight: "84%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: 24 },
  groupTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 10,
  },
  scrollBottomSpace: { height: 8 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  clearLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  applyButton: {},
});
