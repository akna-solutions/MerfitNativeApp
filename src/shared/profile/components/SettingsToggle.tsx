import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Switch, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
};

export function SettingsToggle({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  isLast,
}: Props) {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      {icon ? (
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={16} color={colors.textMuted} />
        </View>
      ) : null}
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: "rgba(255,255,255,0.12)",
          true: colors.buttonElectricBlue,
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="rgba(255,255,255,0.12)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
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
});
