import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { DumbbellSpinner } from "../../../../shared/motion/DumbbellSpinner";

import { FoodListItem } from "../../../../services/api/types";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import { displayUnit, isWeighableUnit } from "../servingUnits";

const MAX_AMOUNT = 5000;
const MAX_PORTIONS = 100;
const QUICK_AMOUNTS = [50, 100, 150, 200];

/** Kullanicinin sectigi miktar: g/ml cinsinden (amount) ya da porsiyon carpani (quantity). */
export type PortionSelection = { amount: number } | { quantity: number };

type Props = {
  food: FoodListItem;
  isSubmitting: boolean;
  onConfirm: (selection: PortionSelection) => void;
  /** Verilmezse "Geri" baglantisi gosterilmez (orn. duzenleme penceresi). */
  onBack?: () => void;
  /** Duzenlemede mevcut miktar (g/ml ya da porsiyon); verilmezse bir porsiyon. */
  initialValue?: number;
  /** Onay butonunun etiketi; varsayilan "Ekle". */
  confirmLabel?: string;
};

/** "37", "37,5" ve "37.5" girislerini sayiya cevirir; gecersizse null. */
function parseAmount(text: string): number | null {
  const value = Number(text.replace(",", ".").trim());
  return Number.isFinite(value) && value > 0 ? value : null;
}

function formatNumber(value: number): string {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
}

export function FoodPortionPicker({ food, isSubmitting, onConfirm, onBack, initialValue, confirmLabel = "Ekle" }: Props) {
  const { colors, isDark } = useTheme();
  const weighable = isWeighableUnit(food.servingUnit) && food.servingSize > 0;
  const unit = displayUnit(food.servingUnit);

  // Tartilabilir besinlerde referans 100 g/ml; digerlerinde besinin kendi porsiyonu (orn. 1 adet).
  const referenceSize = weighable ? 100 : food.servingSize;
  const perReference = (value: number) => (weighable ? (value * 100) / food.servingSize : value);

  const [text, setText] = useState(
    initialValue != null ? formatNumber(initialValue).replace(/\./g, "") : weighable ? String(food.servingSize) : "1",
  );
  const value = parseAmount(text);
  const limit = weighable ? MAX_AMOUNT : MAX_PORTIONS;
  const isValid = value !== null && value <= limit;

  // Backend ile ayni hesap: carpan = miktar / porsiyon (porsiyon girisinde dogrudan carpan).
  const factor = isValid ? (weighable ? value / food.servingSize : value) : 0;
  const totalCalories = Math.round(food.calories * factor);

  const macros = [
    { label: "Protein", value: food.protein },
    { label: "Karb.", value: food.carbs },
    { label: "Yağ", value: food.fat },
  ];

  return (
    <View style={styles.container}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={8} style={styles.backRow}>
          <Ionicons name="chevron-back" size={16} color={colors.primary} />
          <Text style={[styles.backLabel, { color: colors.primary }]}>Geri</Text>
        </Pressable>
      ) : null}

      <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
      {food.brand ? <Text style={[styles.brand, { color: colors.textSecondary }]}>{food.brand}</Text> : null}

      <View style={[styles.referenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.referenceLabel, { color: colors.textSecondary }]}>
          {formatNumber(referenceSize)} {unit} için
        </Text>
        <Text style={[styles.referenceCalories, { color: colors.text }]}>
          {Math.round(perReference(food.calories))} kcal
        </Text>
        <View style={styles.macroRow}>
          {macros.map((macro) => (
            <Text key={macro.label} style={[styles.macroText, { color: colors.textSecondary }]}>
              {macro.label} {formatNumber(perReference(macro.value))} g
            </Text>
          ))}
        </View>
      </View>

      <Text style={[styles.inputLabel, { color: colors.text }]}>
        {weighable ? `Ne kadar yediniz? (${unit})` : `Kaç ${unit}?`}
      </Text>
      <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: isValid ? colors.border : colors.danger }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          keyboardType="decimal-pad"
          keyboardAppearance={isDark ? "dark" : "light"}
          selectTextOnFocus
          style={[styles.input, { color: colors.text }]}
          accessibilityLabel={weighable ? `Miktar, ${unit}` : `Porsiyon, ${unit}`}
        />
        <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>{unit}</Text>
      </View>
      {!isValid ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {weighable ? `1 ile ${MAX_AMOUNT} ${unit} arasında bir değer girin.` : `0 ile ${MAX_PORTIONS} arasında bir değer girin.`}
        </Text>
      ) : null}

      {weighable ? (
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((amount) => (
            <Pressable
              key={amount}
              onPress={() => setText(String(amount))}
              style={[styles.quickChip, { borderColor: value === amount ? colors.primary : colors.border }]}
            >
              <Text style={[styles.quickLabel, { color: value === amount ? colors.primary : colors.text }]}>
                {amount} {unit}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable
        disabled={!isValid || isSubmitting}
        onPress={() => value !== null && onConfirm(weighable ? { amount: value } : { quantity: value })}
        style={[styles.submitButton, { backgroundColor: colors.primary, opacity: !isValid || isSubmitting ? 0.5 : 1 }]}
      >
        {isSubmitting ? (
          <DumbbellSpinner color="#FFFFFF" />
        ) : (
          <Text style={styles.submitLabel}>{confirmLabel} · {totalCalories} kcal</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 12, paddingBottom: 24 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2, alignSelf: "flex-start" },
  backLabel: { fontSize: 13, fontWeight: "600" },
  foodName: { fontSize: 17, fontWeight: "700", marginTop: 12 },
  brand: { fontSize: 12, marginTop: 2 },
  referenceCard: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  referenceLabel: { fontSize: 12, fontWeight: "600" },
  referenceCalories: { fontSize: 24, fontWeight: "800", marginTop: 4 },
  macroRow: { flexDirection: "row", gap: 14, marginTop: 8, flexWrap: "wrap" },
  macroText: { fontSize: 12, fontWeight: "600" },
  inputLabel: { fontSize: 13, fontWeight: "700", marginTop: 18 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  input: { flex: 1, fontSize: 18, fontWeight: "700", padding: 0 },
  inputUnit: { fontSize: 14, fontWeight: "600" },
  errorText: { fontSize: 12, fontWeight: "600", marginTop: 6 },
  quickRow: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  quickChip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  quickLabel: { fontSize: 12, fontWeight: "600" },
  submitButton: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  submitLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
