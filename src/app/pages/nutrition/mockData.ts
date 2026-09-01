import { FoodItem, NutritionData } from "./types";

// TODO: Backend/API bağlandığında bu mock objeyi gerçek fetch/query
// sonucuyla değiştir. Component'ler NutritionData şeklini beklediği için
// veri kaynağı değişse bile prop arayüzü aynı kalır.
//
// dailyCalories ve macro target'ları onboarding'deki goal/age/height/weight/
// activityLevel/trainingFrequency bilgilerine göre backend'de hesaplanacak
// (ör. Goal: Build Muscle -> daha yüksek kalori/protein hedefi).
export const MOCK_NUTRITION_DATA: NutritionData = {
  hasLoggedFirstMeal: true,
  dailyCalories: 3200,
  macros: {
    protein: { consumed: 120, target: 160 },
    carbs: { consumed: 180, target: 300 },
    fats: { consumed: 55, target: 80 },
  },
  water: { consumedL: 1.5, targetL: 3 },
  meals: [
    { id: "1", type: "Kahvaltı", name: "Yulaf Ezmesi & Yumurta", calories: 420 },
    { id: "2", type: "Öğle Yemeği", name: "Tavuk & Pirinç", calories: 650 },
    { id: "3", type: "Atıştırmalık", name: "Yunan Yoğurdu", calories: 450 },
  ],
};

// Add Meal akışında kullanılacak mock yiyecek listesi - gerçek Food Search
// ekranı/API'si eklendiğinde bu listenin yerini alacak.
export const MOCK_FOODS: FoodItem[] = [
  { id: "chicken-breast", name: "Tavuk Göğsü", calories: 165 },
  { id: "rice", name: "Pirinç", calories: 206 },
  { id: "eggs", name: "Yumurta", calories: 155 },
  { id: "oatmeal", name: "Yulaf Ezmesi", calories: 158 },
  { id: "greek-yogurt", name: "Yunan Yoğurdu", calories: 100 },
  { id: "banana", name: "Muz", calories: 105 },
  { id: "avocado", name: "Avokado", calories: 234 },
  { id: "salmon", name: "Somon", calories: 208 },
];
