import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "../../../../services/api/client";
import { searchFoods } from "../../../../services/api/foods";
import { logMealItem } from "../../../../services/api/nutrition";
import { ApiMealType, FoodListItem } from "../../../../services/api/types";
import { colors } from "../theme";
import { MealEntry, MealType } from "../types";

const MEAL_TYPE_TO_API: Record<MealType, ApiMealType> = {
  "Kahvaltı": "Breakfast",
  "Öğle Yemeği": "Lunch",
  "Akşam Yemeği": "Dinner",
  "Atıştırmalık": "Snack",
};

/** "yyyy-MM-dd" - backend'in DateOnly formati (yerel saat diliminde). */
function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type Props = {
  visible: boolean;
  mealType: MealType | null;
  selectedDate: Date;
  onLogged: (entry: MealEntry) => void;
  onClose: () => void;
};

export function AddMealModal({
  visible,
  mealType,
  selectedDate,
  onLogged,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<FoodListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loggingFoodId, setLoggingFoodId] = useState<number | null>(null);

  // Modal her açıldığında aramayı sıfırla.
  useEffect(() => {
    if (!visible) return;
    setQuery("");
  }, [visible]);

  // Arama metnini debounce ederek backend'e istek atıyoruz.
  useEffect(() => {
    if (!visible) return;
    setIsSearching(true);
    setErrorMessage(null);
    const timeout = setTimeout(async () => {
      try {
        const result = await searchFoods({ search: query, pageSize: 30 });
        setFoods(result.items);
      } catch (error) {
        setErrorMessage(
          error instanceof ApiError ? error.message : "Yiyecekler yüklenemedi.",
        );
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, visible]);

  const handleSelectFood = async (food: FoodListItem) => {
    if (!mealType || loggingFoodId !== null) return;
    setLoggingFoodId(food.id);
    try {
      const entry = await logMealItem({
        mealType: MEAL_TYPE_TO_API[mealType],
        foodId: food.id,
        date: toDateParam(selectedDate),
      });
      onLogged({
        id: String(entry.id),
        type: entry.type,
        name: entry.name,
        calories: entry.calories,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Öğün eklenemedi. Lütfen tekrar deneyin.",
      );
    } finally {
      setLoggingFoodId(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

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

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {isSearching ? (
            <ActivityIndicator
              color={colors.electricBlue}
              style={styles.loadingIndicator}
            />
          ) : (
            <FlatList
              data={foods}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.foodRow}
                  onPress={() => handleSelectFood(item)}
                  disabled={loggingFoodId !== null}
                >
                  <Text style={styles.foodName}>{item.name}</Text>
                  {loggingFoodId === item.id ? (
                    <ActivityIndicator color={colors.electricBlue} size="small" />
                  ) : (
                    <Text style={styles.foodCalories}>{item.calories} kcal</Text>
                  )}
                </Pressable>
              )}
            />
          )}
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
  errorText: { color: "#FF6B6B", fontSize: 12, fontWeight: "600", marginTop: 12 },
  loadingIndicator: { marginTop: 24 },
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
