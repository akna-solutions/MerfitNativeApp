import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

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
  const { colors } = useTheme();
  return (
    <>
      <Pressable
        onPress={onRequestOpen}
        style={[styles.button, { backgroundColor: colors.dangerBackground, borderColor: colors.dangerBorder }]}
      >
        <Text style={[styles.label, { color: colors.danger }]}>Çıkış Yap</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onCancel}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

          <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>MB FIT'ten çıkış yapılsın mı?</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              Hesabından çıkış yapmak istediğine emin misin?
            </Text>

            <View style={styles.actions}>
              <Pressable
                onPress={onCancel}
                style={[styles.cancelButton, { backgroundColor: colors.inputBackground }]}
              >
                <Text style={[styles.cancelLabel, { color: colors.text }]}>İptal</Text>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                style={[styles.confirmButton, { backgroundColor: colors.danger }]}
              >
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 14, fontWeight: "700" },
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 16, fontWeight: "700" },
  message: {
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
  },
  cancelLabel: { fontSize: 13, fontWeight: "700" },
  confirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});
