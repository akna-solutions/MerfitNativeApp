import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

export type MenuItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

type Props = {
  title: string;
  items: MenuItem[];
};

export function MenuList({ title, items }: Props) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.card}>
        {items.map((item, index) => (
          <Pressable
            key={item.id}
            onPress={item.onPress}
            style={[styles.row, index === items.length - 1 && styles.rowLast]}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={16} color={colors.textMuted} />
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {item.subtitle ? (
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              ) : null}
            </View>
            <Ionicons
              name="chevron-forward"
              size={15}
              color={colors.textMuted}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 18,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
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
  itemTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  itemSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
});
