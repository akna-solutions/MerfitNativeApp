import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "../../../../services/api/client";
import { getFoodByBarcode, searchFoods } from "../../../../services/api/foods";
import { logMealItem } from "../../../../services/api/nutrition";
import { ApiMealType, FoodListItem } from "../../../../services/api/types";
import { useTheme } from "../../../../shared/theme/ThemeContext";
import { MealEntry, MealType } from "../types";
import { displayUnit } from "../servingUnits";
import { BarcodeScanner } from "./BarcodeScanner";
import { FoodPortionPicker, PortionSelection } from "./FoodPortionPicker";

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

/** Modal icindeki adim: arama listesi, kamera ile barkod okuma, miktar secimi. */
type Step = "search" | "scan" | "portion";

/** Barkod sorgusu hatasini kullaniciya anlasilir bir mesaja cevirir. */
function barcodeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return "Bu barkoda ait ürün bulunamadı. Listeden arayarak ekleyebilirsiniz.";
    if (error.status === 503) return "Barkod servisine şu an ulaşılamıyor. Biraz sonra tekrar deneyin.";
    return error.message;
  }
  return "Barkod sorgulanamadı. Bağlantınızı kontrol edin.";
}

/** Liste satirinda kalorinin hangi porsiyona ait oldugu: "100 g", "1 adet". */
function formatServing(food: FoodListItem): string {
  return `${food.servingSize.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} ${displayUnit(food.servingUnit)}`;
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
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<FoodListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("search");
  const [selectedFood, setSelectedFood] = useState<FoodListItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);

  // Modal her açıldığında aramayı ve adımı sıfırla.
  useEffect(() => {
    if (!visible) return;
    setQuery("");
    setStep("search");
    setSelectedFood(null);
    setErrorMessage(null);
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

  const handleSelectFood = (food: FoodListItem) => {
    setErrorMessage(null);
    setSelectedFood(food);
    setStep("portion");
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setErrorMessage(null);
    setIsLookingUpBarcode(true);
    try {
      handleSelectFood(await getFoodByBarcode(barcode));
    } catch (error) {
      setErrorMessage(barcodeErrorMessage(error));
      setStep("search");
    } finally {
      setIsLookingUpBarcode(false);
    }
  };

  const handleConfirmPortion = async (selection: PortionSelection) => {
    if (!mealType || !selectedFood || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const entry = await logMealItem({
        mealType: MEAL_TYPE_TO_API[mealType],
        foodId: selectedFood.id,
        date: toDateParam(selectedDate),
        ...selection,
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
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <SafeAreaView style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]} edges={["bottom"]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Öğün Ekle</Text>
              {mealType ? (
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{mealType}</Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={[styles.closeButton, { backgroundColor: colors.inputBackground }]}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>

          {step === "scan" ? (
            isLookingUpBarcode ? (
              <View style={styles.lookupBox}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.lookupText, { color: colors.textSecondary }]}>Ürün aranıyor...</Text>
              </View>
            ) : (
              <BarcodeScanner onScanned={handleBarcodeScanned} onCancel={() => setStep("search")} />
            )
          ) : step === "portion" && selectedFood ? (
            <>
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
              <FoodPortionPicker
                food={selectedFood}
                isSubmitting={isSubmitting}
                onConfirm={handleConfirmPortion}
                onBack={() => setStep("search")}
              />
            </>
          ) : (
            <>
              <View style={styles.searchRow}>
                <View style={[styles.searchWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons
                    name="search-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Yiyecek ara..."
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardAppearance={isDark ? "dark" : "light"}
                    style={[styles.searchInput, { color: colors.text }]}
                  />
                </View>

                <Pressable
                  style={[styles.scanButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
                  onPress={() => {
                    setErrorMessage(null);
                    setStep("scan");
                  }}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Barkod tara"
                >
                  <Ionicons
                    name="barcode-outline"
                    size={26}
                    color={colors.primary}
                  />
                </Pressable>
              </View>

              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              {isSearching ? (
                <ActivityIndicator
                  color={colors.primary}
                  style={styles.loadingIndicator}
                />
              ) : (
                <FlatList
                  data={foods}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={styles.list}
                  ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.foodRow}
                      onPress={() => handleSelectFood(item)}
                    >
                      <Text style={[styles.foodName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.foodCalories, { color: colors.textSecondary }]}>
                        {item.calories} kcal / {formatServing(item)}
                      </Text>
                    </Pressable>
                  )}
                />
              )}
            </>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontSize: 13, padding: 0 },
  scanButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { color: "#FF6B6B", fontSize: 12, fontWeight: "600", marginTop: 12 },
  loadingIndicator: { marginTop: 24 },
  lookupBox: { alignItems: "center", gap: 10, paddingVertical: 40 },
  lookupText: { fontSize: 13, fontWeight: "600" },
  list: { paddingTop: 14, paddingBottom: 24 },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  foodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  foodName: { flex: 1, fontSize: 13, fontWeight: "600", paddingRight: 12 },
  foodCalories: { fontSize: 12, fontWeight: "600" },
});
