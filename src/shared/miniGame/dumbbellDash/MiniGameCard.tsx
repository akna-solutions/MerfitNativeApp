import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../theme/ThemeContext";
import type { MiniGameResult } from "../../../services/api/types";
import { Mascot } from "./components/Mascot";
import { DumbbellDashPanel } from "./DumbbellDashPanel";

type Props = {
  /** Puan verildiginde cagrilir (orn. MB FIT Puanim ekrani puani yeniler). */
  onRewardGranted?: (result: MiniGameResult) => void;
  /** Oyun penceresi kapatildiginda cagrilir. */
  onClosed?: () => void;
};

/**
 * MB FIT Puanim ekranindaki mini oyun karti. Aktif antrenman gerektirmez; oyun, dinlenme ekranindakiyle ayni
 * DumbbellDashPanel'i tam ekran bir pencerede acar.
 */
export function MiniGameCard({ onRewardGranted, onClosed }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const close = () => {
    setOpen(false);
    onClosed?.();
  };

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}>
          <View style={styles.mascotWrap}>
            <Mascot size={46} />
          </View>
          <View style={styles.textBlock}>
            <Text style={[styles.title, { color: colors.text }]}>Dumbbell Dash</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Ekrana dokunarak maskotu zıplat, dambılların arasından geç. Skorun yükseldikçe MB FIT puanı kazanırsın.
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, { backgroundColor: colors.text, opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[styles.ctaLabel, { color: colors.background }]}>Mini Oyun Oyna</Text>
        </Pressable>
      </View>

      <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <SafeAreaView style={styles.modalSafe} edges={["top", "bottom"]}>
            {open ? (
              <DumbbellDashPanel
                subtitle="Skoruna göre MB FIT puanı kazan"
                onClose={close}
                onRewardGranted={onRewardGranted}
              />
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 18, gap: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  mascotWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#0E1014",
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { flex: 1 },
  title: { fontSize: 16, fontWeight: "800" },
  body: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  cta: { minHeight: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  ctaLabel: { fontSize: 14, fontWeight: "800" },
  modalRoot: { flex: 1 },
  modalSafe: { flex: 1, justifyContent: "center", paddingHorizontal: 16 },
});
