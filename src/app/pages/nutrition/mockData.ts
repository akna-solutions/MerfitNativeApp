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
    { id: "1", type: "Breakfast", name: "Oatmeal & Eggs", calories: 420 },
    { id: "2", type: "Lunch", name: "Chicken & Rice", calories: 650 },
    { id: "3", type: "Snacks", name: "Greek Yogurt", calories: 450 },
  ],
};

// Add Meal akışında kullanılacak mock yiyecek listesi - gerçek Food Search
// ekranı/API'si eklendiğinde bu listenin yerini alacak.
export const MOCK_FOODS: FoodItem[] = [
  { id: "chicken-breast", name: "Chicken Breast", calories: 165 },
  { id: "rice", name: "Rice", calories: 206 },
  { id: "eggs", name: "Eggs", calories: 155 },
  { id: "oatmeal", name: "Oatmeal", calories: 158 },
  { id: "greek-yogurt", name: "Greek Yogurt", calories: 100 },
  { id: "banana", name: "Banana", calories: 105 },
  { id: "avocado", name: "Avocado", calories: 234 },
  { id: "salmon", name: "Salmon", calories: 208 },
];
