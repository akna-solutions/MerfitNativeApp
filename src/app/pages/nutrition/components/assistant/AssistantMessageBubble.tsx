import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import type { ChatItem } from "../../../../../shared/nutritionAssistant/chatState";
import { useTheme } from "../../../../../shared/theme/ThemeContext";

type Props = {
  item: Pick<ChatItem, "role" | "content" | "status">;
  onRetry?: () => void;
};

/**
 * Tek sohbet balonu. Icerik her zaman duz metin olarak gosterilir (model yaniti HTML/Markdown olarak
 * yorumlanmaz). Basarisiz kullanici mesajinda "Tekrar dene" gosterilir.
 */
export function AssistantMessageBubble({ item, onRetry }: Props) {
  const { colors } = useTheme();
  const isUser = item.role === "user";
  const failed = item.status === "failed";

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View
        testID={isUser ? "assistant-bubble-user" : "assistant-bubble-assistant"}
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 6 }
            : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderBottomLeftRadius: 6 },
          item.status === "sending" && styles.pending,
          failed && { borderColor: colors.danger, borderWidth: 1 },
        ]}
      >
        <Text selectable style={[styles.text, { color: isUser ? "#FFFFFF" : colors.text }]}>
          {item.content}
        </Text>
      </View>
      {failed ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mesajı tekrar gönder"
          onPress={onRetry}
          hitSlop={8}
          style={styles.retry}
        >
          <Ionicons name="refresh" size={13} color={colors.danger} />
          <Text style={[styles.retryText, { color: colors.danger }]}>Gönderilemedi · Tekrar dene</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Asistan yaniti beklenirken gosterilen uc noktali gosterge. */
export function AssistantTypingIndicator() {
  const { colors } = useTheme();
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(
        160,
        dots.map((dot) =>
          Animated.sequence([
            Animated.timing(dot, { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0.3, duration: 280, useNativeDriver: true }),
          ]),
        ),
      ),
    );
    loop.start();
    return () => loop.stop();
  }, [dots]);

  return (
    <View style={[styles.row, styles.rowAssistant]} accessibilityLabel="Asistan yazıyor" testID="assistant-typing">
      <View style={[styles.bubble, styles.typing, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth }]}>
        {dots.map((opacity, i) => (
          <Animated.View key={i} style={[styles.dot, { backgroundColor: colors.primary, opacity }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 5, maxWidth: "100%" },
  rowUser: { alignItems: "flex-end" },
  rowAssistant: { alignItems: "flex-start" },
  bubble: { maxWidth: "86%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  pending: { opacity: 0.7 },
  text: { fontSize: 14, lineHeight: 20 },
  retry: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  retryText: { fontSize: 12, fontWeight: "600" },
  typing: { flexDirection: "row", gap: 5, paddingVertical: 14 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
