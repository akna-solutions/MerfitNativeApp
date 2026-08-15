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
import { colors } from "../theme";
import {
    Difficulty,
    DurationRange,
    EMPTY_FILTERS,
    Equipment,
    MuscleGroup,
    WorkoutFilters,
} from "../types";

const DIFFICULTY_OPTIONS: Difficulty[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
];
const DURATION_OPTIONS: { label: string; value: DurationRange }[] = [
  { label: "Under 20 min", value: "under20" },
  { label: "20 - 40 min", value: "20to40" },
  { label: "40+ min", value: "40plus" },
];
const EQUIPMENT_OPTIONS: Equipment[] = [
  "No equipment",
  "Dumbbells",
  "Barbell",
  "Machines",
  "Resistance bands",
];
const MUSCLE_GROUP_OPTIONS: MuscleGroup[] = [
  "Full Body",
  "Upper Body",
  "Lower Body",
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
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <SafeAreaView style={styles.sheet} edges={["bottom"]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter Workouts</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            <Text style={styles.groupTitle}>Difficulty</Text>
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

            <Text style={styles.groupTitle}>Duration</Text>
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

            <Text style={styles.groupTitle}>Equipment</Text>
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

            <Text style={styles.groupTitle}>Muscle Group</Text>
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

          <View style={styles.footer}>
            <Pressable onPress={() => setDraft(EMPTY_FILTERS)} hitSlop={8}>
              <Text style={styles.clearLabel}>Clear all</Text>
            </Pressable>
            <View style={styles.applyButton}>
              <OnboardingButton
                label="Apply Filters"
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
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  body: { paddingHorizontal: 24 },
  groupTitle: {
    color: colors.textMuted,
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
    borderTopColor: colors.border,
  },
  clearLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  applyButton: {},
});
