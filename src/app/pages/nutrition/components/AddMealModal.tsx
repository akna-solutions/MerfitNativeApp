import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MOCK_FOODS } from "../mockData";
import { colors } from "../theme";
import { FoodItem, MealType } from "../types";

type Props = {
  visible: boolean;
  mealType: MealType | null;
  onSelectFood: (food: FoodItem) => void;
  onClose: () => void;
};

export function AddMealModal({
  visible,
  mealType,
  onSelectFood,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");

  const filteredFoods = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_FOODS;
    return MOCK_FOODS.filter((food) => food.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <SafeAreaView style={styles.sheet} edges={["bottom"]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Öğün Ekle</Text>
              {mealType ? (
                <Text style={styles.headerSubtitle}>{mealType}</Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.searchWrapper}>
            <Ionicons
              name="search-outline"
              size={16}
              color={colors.textMuted}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Yiyecek ara..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardAppearance="dark"
              style={styles.searchInput}
            />
          </View>

          <Pressable
            style={styles.scanRow}
            onPress={() => {
              // TODO: barcode scanner (expo-camera / expo-barcode-scanner)
              // eklendiğinde burada tetiklenecek.
            }}
          >
            <Ionicons
              name="barcode-outline"
              size={16}
              color={colors.electricBlue}
            />
            <Text style={styles.scanLabel}>Barkod tara</Text>
          </Pressable>

          <FlatList
            data={filteredFoods}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <Pressable
                style={styles.foodRow}
                onPress={() => onSelectFood(item)}
              >
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodCalories}>{item.calories} kcal</Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    maxHeight: "80%",
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 20,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },
  headerSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    marginTop: 18,
    backgroundColor: colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 13, padding: 0 },
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  scanLabel: { color: colors.electricBlue, fontSize: 12, fontWeight: "600" },
  list: { paddingTop: 14, paddingBottom: 24 },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  foodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  foodName: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  foodCalories: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
});
