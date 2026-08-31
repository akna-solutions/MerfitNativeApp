import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinue}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onContinue} />

        <View style={styles.dialog}>
          <Text style={styles.title}>Antrenmandan çıkılsın mı?</Text>
          <Text style={styles.message}>
            Mevcut ilerlemen kaydedilecek.
          </Text>

          <View style={styles.actions}>
            <Pressable onPress={onContinue} style={styles.continueButton}>
              <Text style={styles.continueLabel}>Antrenmana Devam Et</Text>
            </Pressable>
            <Pressable onPress={onSaveAndExit} style={styles.exitButton}>
              <Text style={styles.exitLabel}>Kaydet ve Çık</Text>
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
    backgroundColor: "#15181E",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  message: {
    color: colors.textMuted,
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
    backgroundColor: colors.buttonElectricBlue,
  },
  continueLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  exitButton: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  exitLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
});
