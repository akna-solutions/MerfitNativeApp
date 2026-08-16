import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Props = {
  title?: string;
  children: ReactNode;
};

export function SettingsSection({ title, children }: Props) {
  return (
    <View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 18,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
