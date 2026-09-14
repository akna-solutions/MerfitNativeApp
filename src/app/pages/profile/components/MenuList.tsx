import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

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
  const { colors } = useTheme();

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {items.map((item, index) => (
          <Pressable
            key={item.id}
            onPress={item.onPress}
            style={[
              styles.row,
              { borderBottomColor: colors.border },
              index === items.length - 1 && styles.rowLast,
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.inputBackground }]}>
              <Ionicons name={item.icon} size={16} color={colors.textSecondary} />
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
              {item.subtitle ? (
                <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
              ) : null}
            </View>
            <Ionicons
              name="chevron-forward"
              size={15}
              color={colors.textSecondary}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
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
  itemTitle: { fontSize: 13, fontWeight: "600" },
  itemSubtitle: { fontSize: 11, marginTop: 2 },
});
