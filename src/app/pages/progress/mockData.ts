import { ProgressData, TimeRange, WeightPoint } from "./types";

// TODO: Backend/API bağlandığında bu mock objeyi gerçek fetch/query
// sonucuyla değiştir. Component'ler ProgressData şeklini beklediği için
// veri kaynağı değişse bile prop arayüzü aynı kalır.
export const MOCK_PROGRESS_DATA: ProgressData = {
  hasCompletedFirstWorkout: true,

  goalType: "lose_weight",
  goalLabel: "Kilo Ver",

  currentWeight: 78.4,
  startingWeight: 82,
  targetWeight: 75,
  monthlyChange: -2.6,

  workouts: 18,
  calories: 6420,
  streak: 12,
  trainingMinutes: 780,

  weeklyWorkouts: [true, true, false, true, true, false, false],

  weightHistory: [
    { date: "Haz 01", weight: 82 },
    { date: "Haz 15", weight: 81.4 },
    { date: "Tem 01", weight: 80.7 },
    { date: "Tem 15", weight: 79.8 },
    { date: "Ağu 01", weight: 79 },
    { date: "Ağu 15", weight: 78.4 },
  ],

  bodyMetrics: [
    { id: "weight", label: "Kilo", value: "78.4 kg" },
    { id: "body-fat", label: "Vücut Yağı", value: "%17.8" },
  ],

  recentActivity: [
    {
      id: "1",
      title: "Üst Vücut Kuvveti",
      durationMin: 45,
      dateLabel: "Bugün",
    },
    {
      id: "2",
      title: "Tüm Vücut Antrenmanı",
      durationMin: 38,
      dateLabel: "Dün",
    },
    { id: "3", title: "Bacak Kuvveti", durationMin: 42, dateLabel: "12 Ağu" },
  ],
};

// TODO: Gerçek API bağlandığında her time range için ayrı veri gelecek.
// Şimdilik mock weightHistory üzerinde basit bir dilimleme yapıyoruz.
export function getWeightHistoryForRange(
  history: WeightPoint[],
  range: TimeRange,
): WeightPoint[] {
  switch (range) {
    case "week":
      return history.slice(-2);
    case "month":
      return history.slice(-4);
    case "3months":
    case "year":
    default:
      return history;
  }
}
