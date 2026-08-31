import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  visible: boolean;
  onRequestOpen: () => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function LogOutButton({
  visible,
  onRequestOpen,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <>
      <Pressable onPress={onRequestOpen} style={styles.button}>
        <Text style={styles.label}>Çıkış Yap</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onCancel}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />

          <View style={styles.dialog}>
            <Text style={styles.title}>MERFIT'ten çıkış yapılsın mı?</Text>
            <Text style={styles.message}>
              Hesabından çıkış yapmak istediğine emin misin?
            </Text>

            <View style={styles.actions}>
              <Pressable onPress={onCancel} style={styles.cancelButton}>
                <Text style={styles.cancelLabel}>İptal</Text>
              </Pressable>
              <Pressable onPress={onConfirm} style={styles.confirmButton}>
                <Text style={styles.confirmLabel}>Çıkış Yap</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
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
  actions: { flexDirection: "row", gap: 10, marginTop: 22 },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  cancelLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  confirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.buttonElectricBlue,
  },
  confirmLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});
