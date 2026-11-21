import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  visible: boolean;
  onContinue: () => void;
  onSaveAndExit: () => void;
};

export function ExitWorkoutModal({
  visible,
  onContinue,
  onSaveAndExit,
}: Props) {
  const { colors } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinue}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onContinue} />

        <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Antrenmandan çıkılsın mı?</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Mevcut ilerlemen kaydedilecek.
          </Text>

          <View style={styles.actions}>
            <Pressable onPress={onContinue} style={[styles.continueButton, { backgroundColor: colors.primaryPressed }]}>
              <Text style={styles.continueLabel}>Antrenmana Devam Et</Text>
            </Pressable>
            <Pressable onPress={onSaveAndExit} style={[styles.exitButton, { backgroundColor: colors.inputBackground }]}>
              <Text style={[styles.exitLabel, { color: colors.text }]}>Kaydet ve Çık</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 32,
  },
  dialog: {
    width: "100%",
    borderRadius: 22,
    padding: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 16, fontWeight: "700" },
  message: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
  },
  actions: { marginTop: 22, gap: 10 },
  continueButton: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  continueLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  exitButton: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  exitLabel: { fontSize: 13, fontWeight: "700" },
});
