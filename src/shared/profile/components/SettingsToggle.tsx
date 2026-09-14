import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Switch, Text, View } from "react-native";

import { useTheme } from "../../theme/ThemeContext";

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
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }, isLast && styles.rowLast]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: colors.inputBackground }]}>
          <Ionicons name={icon} size={16} color={colors.textSecondary} />
        </View>
      ) : null}
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: colors.inputBackground,
          true: colors.primaryPressed,
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={colors.inputBackground}
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
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { flex: 1 },
  title: { fontSize: 13, fontWeight: "600" },
  subtitle: { fontSize: 11, marginTop: 2 },
});
