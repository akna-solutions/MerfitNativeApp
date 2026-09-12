// Bu dosyadaki tipler, MerfitCustomerApi.Business/Dtos/**/Customer*.cs altindaki C# DTO'lariyla
// birebir eslesecek sekilde elle senkronize tutulur (System.Text.Json varsayilan olarak
// camelCase serialize eder).

// ---- Auth ----
export type AuthResponse = {
  userId: number;
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
};

export type LoginRequest = {
  emailOrUsername: string;
  password: string;
};

// ---- Dashboard ----
export type DashboardTodayProgress = {
  workoutsCompleted: number;
  workoutsTarget: number;
  calories: number;
};

export type DashboardWorkoutSummary = {
  id: number;
  title: string;
  duration: string;
  meta: string;
  difficulty: "Başlangıç" | "Orta" | "İleri";
  imageUrl: string | null;
};

export type DashboardQuickStat = {
  id: "weight" | "streak" | "calories" | "workouts";
  label: string;
  value: string;
  icon: "scale" | "flame" | "trophy" | "barbell";
};

export type DashboardGoalProgress = {
  currentWeightKg: number;
  goalWeightKg: number;
  startWeightKg: number;
};

export type DashboardResponse = {
  userName: string;
  hasCompletedFirstWorkout: boolean;
  todayProgress: DashboardTodayProgress;
  todayWorkout: DashboardWorkoutSummary | null;
  quickStats: DashboardQuickStat[];
  goalProgress: DashboardGoalProgress | null;
  recommended: DashboardWorkoutSummary[];
};

// ---- Workouts ----
export type WorkoutDifficulty = "Başlangıç" | "Orta" | "İleri";

export type WorkoutListItem = {
  id: number;
  title: string;
  tagline: string | null;
  durationMin: number;
  difficulty: WorkoutDifficulty;
  category: string;
  muscleGroup: string | null;
  equipment: string[];
  imageUrl: string | null;
  featured: boolean;
};

export type WorkoutExerciseSummary = {
  exerciseId: number;
  name: string;
  order: number;
  sets: number;
  reps: number | null;
  restSeconds: number | null;
  durationSeconds: number | null;
  videoUrl: string | null;
  imageUrl: string | null;
};

export type WorkoutDetail = WorkoutListItem & {
  description: string | null;
  exercises: WorkoutExerciseSummary[];
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type WorkoutListQuery = {
  search?: string;
  /** Backend enum degerleri: "Beginner" | "Intermediate" | "Advanced" (virgulle ayrilmis). */
  difficulty?: string;
  duration?: string;
  equipment?: string;
  muscleGroup?: string;
  categorySlug?: string;
  personalized?: boolean;
  page?: number;
  pageSize?: number;
};

// ---- Workout Sessions ----
export type WorkoutSessionStatus = "Started" | "Paused" | "Completed" | "Cancelled" | "Abandoned";

export type WorkoutSetLogEntry = {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  rpe: number | null;
};

export type PreviousBest = {
  weightKg: number;
  reps: number;
};

export type WorkoutSessionExercise = {
  sessionExerciseId: number;
  exerciseId: number;
  name: string;
  order: number;
  targetSets: number;
  targetReps: number | null;
  restSeconds: number | null;
  durationSeconds: number | null;
  videoUrl: string | null;
  imageUrl: string | null;
  completedSets: WorkoutSetLogEntry[];
  previousBest: PreviousBest | null;
};

export type WorkoutSession = {
  id: number;
  workoutId: number;
  title: string;
  status: WorkoutSessionStatus;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  caloriesBurned: number | null;
  exercises: WorkoutSessionExercise[];
};

export type LogWorkoutSetRequest = {
  setNumber: number;
  weightKg?: number | null;
  reps?: number | null;
  durationSeconds?: number | null;
  rpe?: number | null;
};

export type CompleteWorkoutSessionRequest = {
  durationSeconds: number;
  caloriesBurned?: number | null;
  notes?: string | null;
};

export type NewPersonalRecord = {
  exerciseId: number;
  exerciseName: string;
  weightKg: number;
  reps: number;
};

export type WorkoutSessionSummary = {
  sessionId: number;
  durationSeconds: number;
  caloriesBurned: number | null;
  newPersonalRecords: NewPersonalRecord[];
};

// ---- Nutrition ----
export type MacroTarget = {
  consumed: number;
  target: number;
};

export type MacroOverview = {
  protein: MacroTarget;
  carbs: MacroTarget;
  fats: MacroTarget;
};

export type WaterSummary = {
  consumedL: number;
  targetL: number;
};

export type MealEntryType = "Kahvaltı" | "Öğle Yemeği" | "Akşam Yemeği" | "Atıştırmalık";

export type MealEntry = {
  id: number;
  type: MealEntryType;
  name: string;
  calories: number;
};

export type NutritionResponse = {
  hasLoggedFirstMeal: boolean;
  dailyCalories: number;
  macros: MacroOverview;
  water: WaterSummary;
  meals: MealEntry[];
};

/** Backend'in Domain.Enums.MealType degerleri; POST /api/nutrition/meals bu degerleri bekler. */
export type ApiMealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export type LogMealItemRequest = {
  date?: string; // "yyyy-MM-dd"
  mealType: ApiMealType;
  foodId: number;
  quantity?: number;
};

export type LogWaterRequest = {
  amountMl: number;
  date?: string;
};

// ---- Foods ----
export type FoodListItem = {
  id: number;
  name: string;
  brand: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl: string | null;
};

export type FoodListQuery = {
  search?: string;
  page?: number;
  pageSize?: number;
};

// ---- Progress ----
export type ProgressGoalType =
  | "lose_weight"
  | "build_muscle"
  | "get_stronger"
  | "improve_fitness"
  | "maintain_weight"
  | "improve_endurance";

export type ProgressWeightPoint = { date: string; weight: number };

export type ProgressBodyMetric = { id: string; label: string; value: string };

export type ProgressRecentActivity = {
  id: number;
  title: string;
  durationMin: number;
  dateLabel: string;
};

export type ProgressScoreSummary = {
  points: number;
  weeklyChange: number;
  rank: number | null;
};

export type ProgressResponse = {
  hasCompletedFirstWorkout: boolean;
  goalType: ProgressGoalType;
  goalLabel: string;
  goalPercent: number | null;
  workoutsCompleted: number | null;
  workoutsGoal: number | null;
  currentWeight: number;
  startingWeight: number;
  targetWeight: number;
  monthlyChange: number;
  workouts: number;
  calories: number;
  streak: number;
  trainingMinutes: number;
  weeklyWorkouts: boolean[];
  weightHistory: ProgressWeightPoint[];
  bodyMetrics: ProgressBodyMetric[];
  recentActivity: ProgressRecentActivity[];
  score: ProgressScoreSummary | null;
};

export type ProgressRange = "week" | "month" | "3months" | "year";

// ---- Leaderboard ----
export type LeaderboardPeriod = "week" | "month" | "allTime";

export type LeaderboardCurrentUserSummary = {
  id: string;
  name: string;
  points: number;
  weeklyChange: number;
  bestRank: number;
  bestRankMonthLabel: string;
  league: string;
  leaderboardVisible: boolean;
};

export type LeaderboardEntryItem = {
  id: string;
  name: string;
  points: number;
  workouts: number;
  rank: number;
  isCurrentUser: boolean;
};

export type LeaderboardScoreBreakdownItem = { id: string; label: string; points: number };
export type LeaderboardScoreHistoryPoint = { label: string; points: number };

export type LeaderboardAchievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
};

export type LeaderboardReward = {
  rank: number;
  title: string;
  description: string;
  icon: string;
};

export type LeaderboardResponse = {
  hasScoreData: boolean;
  currentUser: LeaderboardCurrentUserSummary;
  topEntries: LeaderboardEntryItem[];
  nearbyEntries: LeaderboardEntryItem[];
  totalRankedUsers: number;
  topPercent: number;
  scoreBreakdown: LeaderboardScoreBreakdownItem[];
  scoreHistory: LeaderboardScoreHistoryPoint[];
  achievements: LeaderboardAchievement[];
  rewards: LeaderboardReward[];
  rewardsResetAt: string | null;
};

// ---- Profile ----
export type ProfileNotificationSettings = {
  workoutReminders: boolean;
  dailyGoalReminder: boolean;
  streakReminder: boolean;
  progressUpdates: boolean;
  leaderboardUpdates: boolean;
  productUpdates: boolean;
};

export type ProfilePrivacySettings = {
  profileVisibleOnLeaderboard: boolean;
  shareWorkoutStatistics: boolean;
  personalizedRecommendations: boolean;
};

export type ProfileStats = { workouts: number; streak: number };

export type ProfileResponse = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  targetWeight: number;
  goal: string;
  experienceLevel: string;
  equipment: string;
  workoutDurationMin: number;
  trainingDays: string[];
  unitSystem: string;
  appearance: string;
  notifications: ProfileNotificationSettings;
  privacy: ProfilePrivacySettings;
  stats: ProfileStats;
};

/** PUT /api/profile - tum alanlar opsiyonel, yalnizca gonderilenler guncellenir. */
export type UpdateProfileRequest = Partial<
  Omit<ProfileResponse, "age" | "stats" | "notifications" | "privacy">
> & {
  notifications?: Partial<ProfileNotificationSettings>;
  privacy?: Partial<ProfilePrivacySettings>;
};
