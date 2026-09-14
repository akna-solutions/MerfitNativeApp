import { FlatList, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { RecentActivityItem } from "../types";

type Props = { items: RecentActivityItem[] };

export function RecentActivity({ items }: Props) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Son Aktiviteler</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View style={styles.textBlock}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.duration, { color: colors.textSecondary }]}>{item.durationMin} dk</Text>
              </View>
              <Text style={[styles.date, { color: colors.textSecondary }]}>{item.dateLabel}</Text>
            </View>
          )}
        />
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
