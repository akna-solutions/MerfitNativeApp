import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { NutritionData } from "../types";
import { MacroCard } from "./MacroCard";

type Props = {
  macros: NutritionData["macros"];
  consumedCalories: number;
  dailyCalories: number;
};

const SIDE_PADDING = 24;
const CARD_GAP = 12;

/** Kalan kalori ve makrolar, yatay kaydirilan (karta oturan) kartlar olarak gosterilir. */
export function MacroOverview({ macros, consumedCalories, dailyCalories }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth = Math.round(width * 0.72);
  const openDetail = () => {
    // TODO: macro detay ekranı eklendiğinde buradan yönlendir.
  };

  const remaining = Math.max(0, dailyCalories - consumedCalories);

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Bugünün Makrobesinleri</Text>

      <ScrollView
        testID="macro-carousel"
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + CARD_GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.content}
      >
        <MacroCard
          label="Kalan Kalori"
          consumed={consumedCalories}
          target={dailyCalories}
          unit="kcal"
          headline={remaining.toLocaleString()}
          headlineCaption="kalan kcal"
          width={cardWidth}
        />
        <MacroCard
          label="Protein"
          consumed={macros.protein.consumed}
          target={macros.protein.target}
          onPress={openDetail}
          width={cardWidth}
        />
        <MacroCard
          label="Karbonhidrat"
          consumed={macros.carbs.consumed}
          target={macros.carbs.target}
          onPress={openDetail}
          width={cardWidth}
        />
        <MacroCard
          label="Yağ"
          consumed={macros.fats.consumed}
          target={macros.fats.target}
          onPress={openDetail}
          width={cardWidth}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    paddingHorizontal: SIDE_PADDING,
  },
  content: { paddingHorizontal: SIDE_PADDING, gap: CARD_GAP },
});
