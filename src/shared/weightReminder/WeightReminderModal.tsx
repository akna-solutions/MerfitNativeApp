import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "../theme/ThemeContext";
import { WeightReminderController } from "./useWeightReminder";
import { fromKg, unitLabel } from "./units";

type Props = { controller: WeightReminderController };

/**
 * "Kilonu güncelle" hatirlaticisi (yaklasik 2 gunde bir). Kaydet kilo gecmisine bugunun kaydini ekler
 * (ayni gun tekrar girilirse gunceller); "Daha sonra" 1 gun, "Bu sefer geç" 2 gun erteler.
 */
export function WeightReminderModal({ controller }: Props) {
  const { colors, isDark } = useTheme();
  const { visible, reminder, unit, saving, errorMessage, save, snooze } = controller;
  const [text, setText] = useState("");

  const lastKg = reminder?.lastWeightKg ?? null;

  useEffect(() => {
    if (visible) setText(lastKg !== null ? String(fromKg(lastKg, unit)).replace(".", ",") : "");
  }, [visible, lastKg, unit]);

  const lastDate = reminder?.lastLoggedDate
    ? new Date(`${reminder.lastLoggedDate}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })
    : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => snooze("later")} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          testID="weight-reminder-modal"
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.icon, { backgroundColor: colors.cardActive }]}>
            <Ionicons name="scale-outline" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Kilonu güncelleyelim mi?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {lastDate && lastKg !== null
              ? `Son kaydın ${lastDate}: ${String(fromKg(lastKg, unit)).replace(".", ",")} ${unitLabel(unit)}. Düzenli kayıt ilerlemeni daha doğru gösterir.`
              : "Düzenli kilo kaydı ilerlemeni daha doğru gösterir."}
          </Text>

          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.inputBackground, borderColor: errorMessage ? colors.danger : colors.border },
            ]}
          >
            <TextInput
              testID="weight-reminder-input"
              value={text}
              onChangeText={setText}
              keyboardType="decimal-pad"
              keyboardAppearance={isDark ? "dark" : "light"}
              placeholder={unit === "imperial" ? "Örn. 172,5" : "Örn. 78,5"}
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { color: colors.text }]}
              accessibilityLabel={`Kilo (${unitLabel(unit)})`}
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={() => void save(text)}
            />
            <Text style={[styles.unit, { color: colors.textSecondary }]}>{unitLabel(unit)}</Text>
          </View>
          {errorMessage ? <Text style={[styles.error, { color: colors.danger }]}>{errorMessage}</Text> : null}

          <Pressable
            testID="weight-reminder-save"
            onPress={() => void save(text)}
            disabled={saving}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed || saving ? 0.85 : 1 }]}
          >
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryLabel}>Kaydet</Text>}
          </Pressable>
          <View style={styles.secondaryRow}>
            <Pressable
              testID="weight-reminder-later"
              onPress={() => snooze("later")}
              disabled={saving}
              accessibilityRole="button"
              style={styles.secondary}
            >
              <Text style={[styles.secondaryLabel, { color: colors.text }]}>Daha sonra</Text>
            </Pressable>
            <Pressable
              testID="weight-reminder-dismiss"
              onPress={() => snooze("dismiss")}
              disabled={saving}
              accessibilityRole="button"
              style={styles.secondary}
            >
              <Text style={[styles.secondaryLabel, { color: colors.textSecondary }]}>Bu sefer geç</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  card: { width: "100%", maxWidth: 380, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 22 },
  icon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { fontSize: 19, fontWeight: "800" },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  inputWrapper: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  input: { flex: 1, fontSize: 22, fontWeight: "700", paddingVertical: 10 },
  unit: { fontSize: 15, fontWeight: "700" },
  error: { fontSize: 12, marginTop: 8 },
  primary: { marginTop: 16, minHeight: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  primaryLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  secondaryRow: { flexDirection: "row", marginTop: 6 },
  secondary: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center" },
  secondaryLabel: { fontSize: 14, fontWeight: "700" },
});
