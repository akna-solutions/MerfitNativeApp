import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { NutritionData } from "../types";
import { MacroCard } from "./MacroCard";

type Props = { macros: NutritionData["macros"] };

export function MacroOverview({ macros }: Props) {
  const { colors } = useTheme();
  const openDetail = () => {
    // TODO: macro detay ekranı eklendiğinde buradan yönlendir.
  };

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Bugünün Makrobesinleri</Text>

      <View style={styles.row}>
        <MacroCard
          label="Protein"
          consumed={macros.protein.consumed}
          target={macros.protein.target}
          onPress={openDetail}
        />
        <MacroCard
          label="Karbonhidrat"
          consumed={macros.carbs.consumed}
          target={macros.carbs.target}
          onPress={openDetail}
        />
      </View>

      <View style={styles.fatsGap}>
        <MacroCard
          label="Yağ"
          consumed={macros.fats.consumed}
          target={macros.fats.target}
          onPress={openDetail}
          fullWidth
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
  row: { flexDirection: "row", gap: 12 },
  fatsGap: { marginTop: 12 },
});
