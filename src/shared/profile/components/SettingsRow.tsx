import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  isLast?: boolean;
  iconColor?: string;
};

export function SettingsRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  isLast,
  iconColor,
}: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.row, isLast && styles.rowLast]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={16} color={iconColor ?? colors.textMuted} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  textBlock: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  subtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  value: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
});
