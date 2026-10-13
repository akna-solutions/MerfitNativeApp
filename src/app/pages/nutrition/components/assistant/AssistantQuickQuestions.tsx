import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { useTheme } from "../../../../../shared/theme/ThemeContext";

type Props = {
  questions: string[];
  disabled?: boolean;
  onSelect: (question: string) => void;
};

/** Kullanicinin guncel durumuna gore sunucunun onerdigi hizli sorular (yatay kaydirilabilir). */
export function AssistantQuickQuestions({ questions, disabled, onSelect }: Props) {
  const { colors } = useTheme();
  if (questions.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
      testID="assistant-quick-questions"
    >
      {questions.map((question) => (
        <Pressable
          key={question}
          accessibilityRole="button"
          accessibilityState={{ disabled: !!disabled }}
          disabled={disabled}
          onPress={() => onSelect(question)}
          style={({ pressed }) => [
            styles.chip,
            { borderColor: colors.borderActive, backgroundColor: pressed ? colors.cardActive : colors.card },
            disabled && styles.disabled,
          ]}
        >
          <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
            {question}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  chip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, maxWidth: 280 },
  label: { fontSize: 13, fontWeight: "600" },
  disabled: { opacity: 0.5 },
});
