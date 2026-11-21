import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { describeError, useStore } from "../../state/StoreContext";
import { ReviewReportReason } from "../../types";

export const REPORT_REASONS: { id: ReviewReportReason; label: string }[] = [
  { id: "Spam", label: "Spam veya reklam" },
  { id: "Offensive", label: "Hakaret veya uygunsuz içerik" },
  { id: "Misleading", label: "Yanıltıcı bilgi" },
  { id: "Irrelevant", label: "Ürünle ilgisiz" },
  { id: "Other", label: "Diğer" },
];

/** Sunucu kurali: "Diger" seciliyse kisa bir aciklama zorunludur. */
const MIN_OTHER_DESCRIPTION = 5;
const MAX_DESCRIPTION = 500;

type Props = { reviewId: string | null; onClose: () => void; onReported: (alreadyReported: boolean) => void };

export function ReportReviewSheet({ reviewId, onClose, onReported }: Props) {
  const { colors } = useTheme();
  const { services } = useStore();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ReviewReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = description.trim();
  const valid = reason !== null && (reason !== "Other" || trimmed.length >= MIN_OTHER_DESCRIPTION);

  const reset = () => {
    setReason(null);
    setDescription("");
    setError(null);
    setSending(false);
  };

  const submit = async () => {
    if (!reviewId || !reason || !valid || sending) return;
    setSending(true);
    setError(null);
    try {
      const result = await services.reviews.report(reviewId, reason, trimmed || null);
      onReported(result.alreadyReported);
    } catch (e) {
      setError(describeError(e, "Rapor gönderilemedi. Lütfen tekrar dene.").message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={reviewId !== null} animationType="slide" transparent onRequestClose={onClose} onShow={reset}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Kapat" accessibilityRole="button" />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 12 }]} testID="report-sheet">
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Yorumu bildir</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Kapat">
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Bildirimin moderasyon ekibine iletilir. Yorumun sahibi kimin bildirdiğini görmez.</Text>
          {REPORT_REASONS.map((r) => {
            const selected = reason === r.id;
            return (
              <Pressable
                key={r.id}
                testID={`report-reason-${r.id}`}
                onPress={() => setReason(r.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[styles.option, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.cardActive : "transparent" }]}
              >
                <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={20} color={selected ? colors.primary : colors.textSecondary} />
                <Text style={[styles.optionLabel, { color: colors.text }]}>{r.label}</Text>
              </Pressable>
            );
          })}
          <TextInput
            testID="report-description"
            value={description}
            onChangeText={setDescription}
            maxLength={MAX_DESCRIPTION}
            multiline
            placeholder={reason === "Other" ? "Kısaca açıkla (zorunlu)" : "Açıklama (isteğe bağlı)"}
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
          />
          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          <Pressable
            testID="report-submit"
            onPress={submit}
            disabled={!valid || sending}
            accessibilityRole="button"
            accessibilityState={{ disabled: !valid || sending }}
            style={[styles.submit, { backgroundColor: colors.primary, opacity: valid ? 1 : 0.45 }]}
          >
            {sending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitLabel}>Bildir</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingTop: 16, paddingHorizontal: 20, gap: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 17, fontWeight: "700" },
  hint: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  option: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 46, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1 },
  optionLabel: { fontSize: 14, fontWeight: "600", flex: 1 },
  input: { minHeight: 72, maxHeight: 140, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 12, fontSize: 14, textAlignVertical: "top" },
  error: { fontSize: 13, fontWeight: "600" },
  submit: { height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginTop: 4 },
  submitLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
