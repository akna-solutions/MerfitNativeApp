import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { Reward } from "../types";
import { RewardImage } from "./RewardImage";

type Props = {
  reward: Reward | null;
  onClose: () => void;
};

export function RewardDetailModal({ reward, onClose }: Props) {
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
          <View style={styles.dialog}>
            <RewardImage icon={reward.icon} size="large" />
            <Text style={styles.rankLabel}>#{reward.rank}. Sıra Ödülü</Text>
            <Text style={styles.title}>{reward.title}</Text>
            <Text style={styles.description}>{reward.description}</Text>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeLabel}>Kapat</Text>
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
    backgroundColor: "#15181E",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rankLabel: {
    color: colors.electricBlue,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 16,
    letterSpacing: 0.5,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  description: {
    color: colors.textMuted,
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
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  closeLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
});
