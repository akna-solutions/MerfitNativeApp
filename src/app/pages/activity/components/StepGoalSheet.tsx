import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { formatSteps } from "../../../../shared/steps/format";
import { GlassSurface } from "../../../../shared/glass/GlassSurface";
import { glassTokens, useLiquidGlass } from "../../../../shared/glass/liquidGlass";
import { useTheme } from "../../../../shared/theme/ThemeContext";

export const PRESET_GOALS = [5_000, 7_500, 10_000, 12_500, 15_000];

type Props = {
  visible: boolean;
  currentGoal: number;
  minGoal: number;
  maxGoal: number;
  onClose: () => void;
  onSave: (goal: number) => void;
};

/** Gunluk adim hedefi secimi: hazir hedefler veya ozel hedef. Kaydedince yuzde aninda guncellenir. */
export function StepGoalSheet({ visible, currentGoal, minGoal, maxGoal, onClose, onSave }: Props) {
  const { colors, isDark } = useTheme();
  // iOS 26+: pencere Liquid Glass'tir, arkadaki ekran hafif karartilmis haliyle camdan bulanik gorunur.
  const liquidGlass = useLiquidGlass();
  const glass = glassTokens(isDark);
  const isPreset = PRESET_GOALS.includes(currentGoal);
  const [selected, setSelected] = useState<number | "custom">(isPreset ? currentGoal : "custom");
  const [custom, setCustom] = useState(isPreset ? "" : String(currentGoal));

  useEffect(() => {
    if (!visible) return;
    const preset = PRESET_GOALS.includes(currentGoal);
    setSelected(preset ? currentGoal : "custom");
    setCustom(preset ? "" : String(currentGoal));
  }, [visible, currentGoal]);

  const customValue = Number(custom.replace(/\D/g, ""));
  const customValid = Number.isInteger(customValue) && customValue >= minGoal && customValue <= maxGoal;
  const value = selected === "custom" ? (customValid ? customValue : null) : selected;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[styles.backdrop, liquidGlass && { backgroundColor: glass.dimmedBackdrop }]} onPress={onClose} accessibilityLabel="Kapat" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheetWrap}>
        <GlassSurface
          enabled={liquidGlass}
          style={styles.sheet}
          fallbackStyle={{ backgroundColor: colors.surface, borderColor: colors.border }}
          glassStyle={{ borderColor: glass.edge }}
          testID="step-goal-sheet"
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.text }]}>Günlük adım hedefi</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Hedefini değiştirdiğinde bugünkü ilerleme yüzdesi hemen güncellenir.
          </Text>

          <View style={styles.options}>
            {PRESET_GOALS.map((goal) => {
              const active = selected === goal;
              return (
                <Pressable
                  key={goal}
                  testID={`goal-option-${goal}`}
                  onPress={() => setSelected(goal)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.option,
                    { backgroundColor: active ? colors.cardActive : colors.inputBackground, borderColor: active ? colors.borderActive : "transparent" },
                  ]}
                >
                  <Text style={[styles.optionText, { color: active ? colors.primary : colors.text }]}>{formatSteps(goal)}</Text>
                </Pressable>
              );
            })}
            <Pressable
              testID="goal-option-custom"
              onPress={() => setSelected("custom")}
              accessibilityRole="radio"
              accessibilityState={{ selected: selected === "custom" }}
              style={[
                styles.option,
                {
                  backgroundColor: selected === "custom" ? colors.cardActive : colors.inputBackground,
                  borderColor: selected === "custom" ? colors.borderActive : "transparent",
                },
              ]}
            >
              <Text style={[styles.optionText, { color: selected === "custom" ? colors.primary : colors.text }]}>Özel hedef</Text>
            </Pressable>
          </View>

          {selected === "custom" ? (
            <View>
              <TextInput
                testID="goal-custom-input"
                value={custom}
                onChangeText={(text) => setCustom(text.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                placeholder="Örn. 8000"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                autoFocus
              />
              <Text style={[styles.hint, { color: custom && !customValid ? colors.danger : colors.textSecondary }]}>
                {formatSteps(minGoal)} ile {formatSteps(maxGoal)} adım arasında bir hedef gir.
              </Text>
            </View>
          ) : null}

          <Pressable
            testID="goal-save"
            disabled={value === null}
            onPress={() => {
              if (value === null) return;
              onSave(value);
              onClose();
            }}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.save,
              { backgroundColor: pressed ? colors.primaryPressed : colors.primary, opacity: value === null ? 0.5 : 1 },
            ]}
          >
            <Text style={styles.saveLabel}>{value === null ? "Hedef seç" : `${formatSteps(value)} adım olarak kaydet`}</Text>
          </Pressable>
        </GlassSurface>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.5)" },
  sheetWrap: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, borderWidth: StyleSheet.hairlineWidth, gap: 14 },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2 },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { fontSize: 13, lineHeight: 18 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, minWidth: "30%", alignItems: "center", flexGrow: 1 },
  optionText: { fontSize: 14, fontWeight: "700" },
  input: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: "700" },
  hint: { fontSize: 12, marginTop: 6 },
  save: { borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  saveLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
