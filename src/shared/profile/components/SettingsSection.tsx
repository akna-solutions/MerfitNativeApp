import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/ThemeContext";

type Props = {
  title?: string;
  children: ReactNode;
};

export function SettingsSection({ title, children }: Props) {
  const { colors } = useTheme();
  return (
    <View>
      {title ? <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text> : null}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
