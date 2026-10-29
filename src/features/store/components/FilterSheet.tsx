import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { SortKey } from "../types";
import { SORT_LABELS } from "../utils/catalog";

export type FilterState = {
  sort: SortKey;
  inStockOnly: boolean;
  discountedOnly: boolean;
  brands: string[];
  priceRange: string;
};

export const DEFAULT_FILTERS: FilterState = { sort: "featured", inStockOnly: false, discountedOnly: false, brands: [], priceRange: "all" };

export const PRICE_RANGES: { id: string; label: string; min?: number; max?: number }[] = [
  { id: "all", label: "Tümü" },
  { id: "0-250", label: "0 - 250 ₺", max: 250 },
  { id: "250-750", label: "250 - 750 ₺", min: 250, max: 750 },
  { id: "750-2000", label: "750 - 2.000 ₺", min: 750, max: 2000 },
  { id: "2000+", label: "2.000 ₺ ve üzeri", min: 2000 },
];

type Props = {
  visible: boolean;
  initial: FilterState;
  brands: string[];
  onApply: (next: FilterState) => void;
  onClose: () => void;
};

function Chip({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.cardActive : colors.inputBackground }]}
    >
      <Text style={[styles.chipLabel, { color: selected ? colors.primary : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Siralama + filtre alt sayfasi. "Uygula"ya basilana kadar liste degismez. */
export function FilterSheet({ visible, initial, brands, onApply, onClose }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<FilterState>(initial);

  const toggleBrand = (brand: string) =>
    setDraft((d) => ({ ...d, brands: d.brands.includes(brand) ? d.brands.filter((b) => b !== brand) : [...d.brands, brand] }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} onShow={() => setDraft(initial)}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Kapat" accessibilityRole="button" />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + 12 }]} testID="filter-sheet">
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Filtrele ve sırala</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Kapat">
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
            <Text style={[styles.groupTitle, { color: colors.text }]}>Sıralama</Text>
            <View style={styles.chips}>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <Chip key={key} testID={`sort-${key}`} label={SORT_LABELS[key]} selected={draft.sort === key} onPress={() => setDraft((d) => ({ ...d, sort: key }))} />
              ))}
            </View>

            <Text style={[styles.groupTitle, { color: colors.text }]}>Fiyat aralığı</Text>
            <View style={styles.chips}>
              {PRICE_RANGES.map((range) => (
                <Chip key={range.id} testID={`price-${range.id}`} label={range.label} selected={draft.priceRange === range.id} onPress={() => setDraft((d) => ({ ...d, priceRange: range.id }))} />
              ))}
            </View>

            <Text style={[styles.groupTitle, { color: colors.text }]}>Marka</Text>
            <View style={styles.chips}>
              {brands.map((brand) => (
                <Chip key={brand} testID={`brand-${brand}`} label={brand} selected={draft.brands.includes(brand)} onPress={() => toggleBrand(brand)} />
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Sadece stoktakiler</Text>
              <Switch testID="switch-stock" value={draft.inStockOnly} onValueChange={(v) => setDraft((d) => ({ ...d, inStockOnly: v }))} trackColor={{ true: colors.primary }} accessibilityLabel="Sadece stoktakiler" />
            </View>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Sadece indirimdekiler</Text>
              <Switch testID="switch-discount" value={draft.discountedOnly} onValueChange={(v) => setDraft((d) => ({ ...d, discountedOnly: v }))} trackColor={{ true: colors.primary }} accessibilityLabel="Sadece indirimdekiler" />
            </View>
          </ScrollView>
          <View style={styles.sheetFooter}>
            <Pressable onPress={() => setDraft(DEFAULT_FILTERS)} accessibilityRole="button" style={[styles.secondary, { borderColor: colors.border }]} testID="filter-reset">
              <Text style={[styles.secondaryLabel, { color: colors.text }]}>Temizle</Text>
            </Pressable>
            <Pressable onPress={() => onApply(draft)} accessibilityRole="button" style={[styles.primary, { backgroundColor: colors.primary }]} testID="filter-apply">
              <Text style={styles.primaryLabel}>Uygula</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: { maxHeight: "86%", borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingTop: 16 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 6 },
  sheetTitle: { fontSize: 17, fontWeight: "700" },
  sheetBody: { paddingHorizontal: 20, paddingBottom: 12 },
  groupTitle: { fontSize: 14, fontWeight: "700", marginTop: 16, marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  chipLabel: { fontSize: 13, fontWeight: "600" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18 },
  switchLabel: { fontSize: 14, fontWeight: "600" },
  sheetFooter: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 8 },
  secondary: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  secondaryLabel: { fontSize: 15, fontWeight: "700" },
  primary: { flex: 2, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  primaryLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
