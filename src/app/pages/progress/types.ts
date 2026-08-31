export type GoalType =
  | "lose_weight"
  | "build_muscle"
  | "get_stronger"
  | "improve_fitness"
  | "maintain_weight"
  | "improve_endurance";

export type WeightPoint = { date: string; weight: number };

export type TimeRange = "week" | "month" | "3months" | "year";

export type RecentActivityItem = {
  id: string;
  title: string;
  durationMin: number;
  dateLabel: string; // "Bugün" / "Dün" / "12 Ağu"
};

export type BodyMetric = {
  id: string;
  label: string;
  value: string;
};

// Onboarding'den gelen hedef bilgisine göre Goal Progress kartının hangi
// şekilde gösterileceğini backend ileride bu alanlardan hesaplayacak;
// component'ler sadece hazır değeri render ediyor.
export type ProgressData = {
  hasCompletedFirstWorkout: boolean;

  goalType: GoalType;
  goalLabel: string;
  // build_muscle / get_stronger / improve_endurance için:
  goalPercent?: number;
  // improve_fitness için:
  workoutsCompleted?: number;
  workoutsGoal?: number;

  currentWeight: number;
  startingWeight: number;
  targetWeight: number;
  monthlyChange: number;

  workouts: number;
  calories: number;
  streak: number;
  trainingMinutes: number;

  weeklyWorkouts: boolean[]; // Pzt..Paz, length 7
  weightHistory: WeightPoint[];
  bodyMetrics: BodyMetric[];
  recentActivity: RecentActivityItem[];
};
