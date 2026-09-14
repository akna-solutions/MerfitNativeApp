import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  firstName: string;
  username: string;
  onEditPress: () => void;
  onAvatarPress: () => void;
};

export function ProfileIdentity({
  firstName,
  username,
  onEditPress,
  onAvatarPress,
}: Props) {
  const { colors } = useTheme();
  const initial = firstName.trim().charAt(0).toUpperCase() || "M";

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={onAvatarPress} style={styles.avatarWrapper}>
        {/* TODO: expo-image-picker eklendiğinde kullanıcı galeriden fotoğraf
            seçebilecek; şimdilik initial harfli placeholder avatar. */}
        <View style={[styles.avatar, { backgroundColor: colors.primaryPressed }]}>
          <Text style={styles.avatarLabel}>{initial}</Text>
        </View>
        <View
          style={[
            styles.editBadge,
            { backgroundColor: colors.primaryPressed, borderColor: colors.background },
          ]}
        >
          <Ionicons name="camera" size={12} color="#FFFFFF" />
        </View>
      </Pressable>

      <Text style={[styles.name, { color: colors.text }]}>{firstName}</Text>
      <Text style={[styles.username, { color: colors.textSecondary }]}>{username}</Text>

      <Pressable
        onPress={onEditPress}
        style={[styles.editButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
      >
        <Text style={[styles.editLabel, { color: colors.text }]}>Profili Düzenle</Text>
      </Pressable>
    </View>
  );
}

const AVATAR_SIZE = 88;

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  avatarWrapper: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(0,168,255,0.35)",
  },
  avatarLabel: { color: "#FFFFFF", fontSize: 32, fontWeight: "700" },
  editBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  name: {
    fontSize: 19,
    fontWeight: "700",
    marginTop: 14,
  },
  username: { fontSize: 13, marginTop: 2 },
  editButton: {
    marginTop: 16,
    height: 38,
    paddingHorizontal: 20,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  editLabel: { fontSize: 12, fontWeight: "600" },
});
