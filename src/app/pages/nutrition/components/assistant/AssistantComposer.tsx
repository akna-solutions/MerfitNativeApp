import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { DumbbellSpinner } from "../../../../../shared/motion/DumbbellSpinner";

import { useTheme } from "../../../../../shared/theme/ThemeContext";

/** Sunucudaki MaxUserMessageLength ile ayni. */
export const MAX_MESSAGE_LENGTH = 1000;

type Props = {
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
  onSend: (text: string) => void;
  onFocus?: () => void;
};

/** Mesaj yazma alani ve gonder butonu. Yanit beklenirken gonderim kapali, yazmaya devam edilebilir. */
export function AssistantComposer({ disabled, sending, placeholder, onSend, onFocus }: Props) {
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const canSend = !disabled && !sending && text.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <View style={[styles.container, { borderTopColor: colors.border }]}>
      <TextInput
        testID="assistant-input"
        value={text}
        onChangeText={setText}
        onFocus={onFocus}
        editable={!disabled}
        placeholder={placeholder ?? "Beslenmenle ilgili bir soru sor…"}
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={MAX_MESSAGE_LENGTH}
        style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
        accessibilityLabel="Mesaj"
      />
      <Pressable
        testID="assistant-send"
        accessibilityRole="button"
        accessibilityLabel="Gönder"
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={submit}
        style={({ pressed }) => [
          styles.send,
          { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
          !canSend && styles.sendDisabled,
        ]}
      >
        {sending ? <DumbbellSpinner color="#FFFFFF" size="small" /> : <Ionicons name="arrow-up" size={20} color="#FFFFFF" />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
  },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  sendDisabled: { opacity: 0.45 },
});
