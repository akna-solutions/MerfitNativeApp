export type WorkoutSummary = {
  id: string;
  title: string;
  duration: string; // "45 min"
  meta: string; // "6 exercises"
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  imageUrl: string;
};

export type TodayProgress = {
  workoutsCompleted: number;
  workoutsTarget: number;
  calories: number;
  steps: number;
  sleepHours: number;
};

export type QuickStat = {
  id: string;
  label: string;
  value: string;
  icon: "scale" | "flame" | "trophy" | "barbell";
};

export type GoalProgress = {
  currentWeightKg: number;
  goalWeightKg: number;
  startWeightKg: number;
};

// Onboarding'den gelen profil bilgilerine göre dashboard'un
// kişiselleştirileceği yer. Şimdilik mock data, ileride API'den
// aynı şekilde bu tipte veri gelecek.
export type DashboardData = {
  userName: string;
  hasCompletedFirstWorkout: boolean;
  todayProgress: TodayProgress;
  todayWorkout: WorkoutSummary | null;
  quickStats: QuickStat[];
  goalProgress: GoalProgress;
  recommended: WorkoutSummary[];
};
