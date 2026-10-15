import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../theme/ThemeContext";
import {
  LOW_BODY_FAT_CONTINUE_LABEL,
  LOW_BODY_FAT_RECONSIDER_LABEL,
  LOW_BODY_FAT_WARNING_MESSAGE,
} from "./bodyFat";

type Props = {
  visible: boolean;
  /** Sunucudan gelen metin; yoksa ortak metin gosterilir. */
  message?: string | null;
  /** "Hedefimi yeniden degerlendirecegim": hedef kaydedilmez, kullanici hedef secimine doner. */
  onReconsider: () => void;
  /** "Uyariyi anladim, devam et": acik onay; istek onayla gonderilir. */
  onConfirm: () => void;
  confirming?: boolean;
};

/**
 * Yag Kaybi secilirken yag orani dusuk aralikta gorunuyorsa gosterilen bilgilendirme. Tani koymaz,
 * hedefi kendiliginden degistirmez: kullanici iki secenekten birini acikca secer. Arka plana dokunmak
 * veya geri tusu "yeniden degerlendir" sayilir (onay hicbir zaman varsayilan degildir).
 */
export function LowBodyFatWarningModal({ visible, message, onReconsider, onConfirm, confirming }: Props) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onReconsider}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onReconsider} />
        <View
          accessibilityRole="alert"
          style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.title, { color: colors.text }]}>Hedefini birlikte gözden geçirelim</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message || LOW_BODY_FAT_WARNING_MESSAGE}
          </Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onReconsider}
              style={[styles.button, { backgroundColor: colors.primaryPressed }]}
            >
              <Text style={styles.primaryLabel}>{LOW_BODY_FAT_RECONSIDER_LABEL}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={confirming}
              onPress={onConfirm}
              style={[styles.button, { backgroundColor: colors.inputBackground, opacity: confirming ? 0.6 : 1 }]}
            >
              <Text style={[styles.secondaryLabel, { color: colors.text }]}>{LOW_BODY_FAT_CONTINUE_LABEL}</Text>
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
  dialog: { width: "100%", borderRadius: 22, padding: 22, borderWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 16, fontWeight: "700" },
  message: { fontSize: 13, marginTop: 8, lineHeight: 19 },
  actions: { marginTop: 22, gap: 10 },
  button: { minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  primaryLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", textAlign: "center" },
  secondaryLabel: { fontSize: 13, fontWeight: "700", textAlign: "center" },
});
