import { Modal, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../theme/ThemeContext";
import type { MiniGameResult } from "../../../services/api/types";
import { DumbbellDashPanel } from "./DumbbellDashPanel";

type Props = {
  visible: boolean;
  onClose: () => void;
  onRewardGranted?: (result: MiniGameResult) => void;
};

/**
 * Dumbbell Dash'i aktif antrenman disinda tam ekran acan ortak pencere (MB FIT Puanim karti ve dashboard'daki
 * dinlenme gunu karti kullanir).
 */
export function MiniGameModal({ visible, onClose, onRewardGranted }: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          {visible ? (
            <DumbbellDashPanel
              subtitle="Skoruna göre MB FIT puanı kazan"
              onClose={onClose}
              onRewardGranted={onRewardGranted}
            />
          ) : null}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, justifyContent: "center", paddingHorizontal: 16 },
});
