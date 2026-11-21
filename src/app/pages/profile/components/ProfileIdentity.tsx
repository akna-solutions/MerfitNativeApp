import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlassSurface } from "../../../../shared/glass/GlassSurface";
import { glassBlueTint, glassTokens, useLiquidGlass } from "../../../../shared/glass/liquidGlass";
import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  fullName: string;
  /** "@kullaniciadi" ya da bos. */
  username: string;
  onEditPress: () => void;
  onAvatarPress: () => void;
};

export function ProfileIdentity({
  fullName,
  username,
  onEditPress,
  onAvatarPress,
}: Props) {
  const { colors, isDark } = useTheme();
  const liquidGlass = useLiquidGlass();
  const initial = fullName.trim().charAt(0).toLocaleUpperCase("tr-TR") || "M";

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

      <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>
      {username ? (
        <Text style={[styles.username, { color: colors.textSecondary }]}>{username}</Text>
      ) : null}

      {/* iOS 26+: "Profili Düzenle" bir cam kapsuldur; basili geri bildirim opaklik yerine hafif kuculmedir. */}
      <Pressable
        onPress={onEditPress}
        style={({ pressed }) => [styles.editPressable, liquidGlass && pressed ? styles.pressedGlass : null]}
      >
        <GlassSurface
          enabled={liquidGlass}
          style={styles.editButton}
          fallbackStyle={{ backgroundColor: colors.inputBackground, borderColor: colors.border }}
          glassStyle={{ borderColor: glassTokens(isDark).edge }}
          pointerEvents="none"
        >
          <Text style={[styles.editLabel, { color: colors.text }]}>Profili Düzenle</Text>
        </GlassSurface>
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
  editPressable: { marginTop: 16 },
  pressedGlass: { transform: [{ scale: 0.96 }] },
  editButton: {
    height: 38,
    paddingHorizontal: 20,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  editLabel: { fontSize: 12, fontWeight: "600" },
});
