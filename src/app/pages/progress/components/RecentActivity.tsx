import { FlatList, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";
import { RecentActivityItem } from "../types";

type Props = { items: RecentActivityItem[] };

export function RecentActivity({ items }: Props) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Son Aktiviteler</Text>

      <View style={styles.card}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.dot} />
              <View style={styles.textBlock}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.duration}>{item.durationMin} dk</Text>
              </View>
              <Text style={styles.date}>{item.dateLabel}</Text>
            </View>
          )}
        />
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
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.electricBlue,
    marginRight: 12,
  },
  textBlock: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  duration: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  date: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
});
