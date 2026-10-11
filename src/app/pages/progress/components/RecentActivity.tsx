import { Ionicons } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { RecentActivityItem } from "../types";

type Props = {
  items: RecentActivityItem[];
  /** Satira dokununca o antrenmanin detayina (egzersiz/set/kilo) gider. */
  onSelect?: (id: string) => void;
  onViewAll?: () => void;
};

export function RecentActivity({ items, onSelect, onViewAll }: Props) {
  const { colors } = useTheme();
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Son Aktiviteler</Text>
        {onViewAll ? (
          <Pressable onPress={onViewAll} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.viewAll, { color: colors.primary }]}>Tümünü gör</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={onSelect ? () => onSelect(item.id) : undefined}
              disabled={!onSelect}
              accessibilityRole={onSelect ? "button" : undefined}
            >
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View style={styles.textBlock}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.duration, { color: colors.textSecondary }]}>{item.durationMin} dk</Text>
              </View>
              <Text style={[styles.date, { color: colors.textSecondary }]}>{item.dateLabel}</Text>
              {onSelect ? (
                <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} style={styles.chevron} />
              ) : null}
            </Pressable>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  viewAll: { fontSize: 13, fontWeight: "700" },
  chevron: { marginLeft: 6 },
  card: {
    borderRadius: 20,
    paddingHorizontal: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  textBlock: { flex: 1 },
  title: { fontSize: 13, fontWeight: "700" },
  duration: { fontSize: 11, marginTop: 2 },
  date: { fontSize: 11, fontWeight: "600" },
});
