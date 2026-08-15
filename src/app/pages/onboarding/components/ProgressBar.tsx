import { StyleSheet, View } from "react-native";

import { colors } from "../theme";

type Props = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.segment,
            index < current ? styles.segmentActive : styles.segmentInactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 4 },
  segment: { flex: 1, height: 3, borderRadius: 2 },
  segmentActive: { backgroundColor: colors.electricBlue },
  segmentInactive: { backgroundColor: colors.progressTrack },
});
