import { ProgressData, TimeRange, WeightPoint } from "./types";

// TODO: Backend/API bağlandığında bu mock objeyi gerçek fetch/query
// sonucuyla değiştir. Component'ler ProgressData şeklini beklediği için
// veri kaynağı değişse bile prop arayüzü aynı kalır.
export const MOCK_PROGRESS_DATA: ProgressData = {
  hasCompletedFirstWorkout: true,

  goalType: "lose_weight",
  goalLabel: "Lose Weight",

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
    { date: "Jun 01", weight: 82 },
    { date: "Jun 15", weight: 81.4 },
    { date: "Jul 01", weight: 80.7 },
    { date: "Jul 15", weight: 79.8 },
    { date: "Aug 01", weight: 79 },
    { date: "Aug 15", weight: 78.4 },
  ],

  bodyMetrics: [
    { id: "weight", label: "Weight", value: "78.4 kg" },
    { id: "body-fat", label: "Body Fat", value: "17.8%" },
  ],

  recentActivity: [
    {
      id: "1",
      title: "Upper Body Strength",
      durationMin: 45,
      dateLabel: "Today",
    },
    {
      id: "2",
      title: "Full Body Workout",
      durationMin: 38,
      dateLabel: "Yesterday",
    },
    { id: "3", title: "Leg Strength", durationMin: 42, dateLabel: "Aug 12" },
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
