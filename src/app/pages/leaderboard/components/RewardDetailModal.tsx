import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { Reward } from "../types";
import { RewardImage } from "./RewardImage";

type Props = {
  reward: Reward | null;
  onClose: () => void;
};

export function RewardDetailModal({ reward, onClose }: Props) {
  const { colors } = useTheme();
  return (
    <Modal
      visible={reward !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {reward ? (
          <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <RewardImage icon={reward.icon} size="large" />
            <Text style={[styles.rankLabel, { color: colors.primary }]}>#{reward.rank}. Sıra Ödülü</Text>
            <Text style={[styles.title, { color: colors.text }]}>{reward.title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{reward.description}</Text>

            <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.inputBackground }]}>
              <Text style={[styles.closeLabel, { color: colors.text }]}>Kapat</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 32,
  },
  dialog: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  rankLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 16,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 19,
  },
  closeButton: {
    marginTop: 22,
    height: 46,
    alignSelf: "stretch",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  closeLabel: { fontSize: 13, fontWeight: "700" },
});
