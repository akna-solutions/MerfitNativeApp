import { StyleSheet, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";

type Props = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.segment,
            { backgroundColor: index < current ? colors.primary : colors.progressTrack },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 4 },
  segment: { flex: 1, height: 3, borderRadius: 2 },
});
