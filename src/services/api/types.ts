// Bu dosyadaki tipler, MerfitCustomerApi.Business/Dtos/**/Customer*.cs altindaki C# DTO'lariyla
// birebir eslesecek sekilde elle senkronize tutulur (System.Text.Json varsayilan olarak
// camelCase serialize eder).

// ---- Fitness hedefi ----
/**
 * Kayit (RegisterRequest.goal) ve ilerleme (ProgressResponse.goalType) sozlesmesinde kullanilan
 * hedef kodlari. Uygulama yalnizca uc ana hedefi sunar (bkz. PRIMARY_FITNESS_GOALS): Kas Gelistirme,
 * Guclenme ve Yag Kaybi. improve_fitness, maintain_weight ve improve_endurance eski kayitlar icin
 * tipte kalir; backend bunlari Kas Gelistirme'ye esler. Hedef agirlik profili backend'de secilir.
 */
export type FitnessGoalCode =
  | "lose_weight"
  | "build_muscle"
  | "get_stronger"
  | "improve_fitness"
  | "maintain_weight"
  | "improve_endurance";

/** Kullaniciya sunulan hedefler (siralama ekrandaki siralamadir). */
export const PRIMARY_FITNESS_GOALS = ["build_muscle", "get_stronger", "lose_weight"] as const;

export type PrimaryFitnessGoalCode = (typeof PRIMARY_FITNESS_GOALS)[number];

/** Eski hedef kodlarini ana hedefe esler (backend FitnessGoals.Normalize ile ayni). */
export function normalizeFitnessGoal(goal: FitnessGoalCode | null | undefined): PrimaryFitnessGoalCode | null {
  if (!goal) return null;
  return (PRIMARY_FITNESS_GOALS as readonly string[]).includes(goal) ? (goal as PrimaryFitnessGoalCode) : "build_muscle";
}

// ---- Antrenman ozellik puanlari ----
/**
 * Bir antrenmanin katalog seviyesindeki ozellik puani (0-100), ham API sekli.
 * Backend'deki WorkoutAttributeScore entity'sine karsilik gelir; kullanicinin kisisel puani
 * veya hedef uyum puani (FitScore) DEGILDIR.
 *
 * `attributeType`: admin DTO'su (AdminWorkoutAttributeScoreItemDto) enum adini metin olarak
 * ("Hypertrophy" ...) doner. Projede JsonStringEnumConverter olmadigi icin enum dogrudan
 * serialize edilirse sayi (0-5) gelir; iki bicim de shared/workoutAttributes'taki
 * normalizeWorkoutAttributeScores ile karsilanir. Ekran bilesenleri bu ham tipi kullanmaz.
 */
export type WorkoutAttributeScoreDto = {
  attributeType: string | number;
  score: number;
};

// ---- Auth ----
export type AuthResponse = {
  userId: number;
  email: string;
  name: string;
  /**
   * Register'da kullanicinin AccountStep'te sectigi deger, Login'de veritabanindaki gercek
   * deger (backend UserProfile.Username). "@" ONEKI ICERMEZ - UI'da gosterilirken eklenmelidir
   * (bkz. ProfileScreen.tsx: `@${profile.username}`).
   */
  username: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  /**
   * Kayit sirasinda olusturulan PersonalizationJob'un durumu ("Pending" | "Processing" |
   * "Completed" | "Failed"). Yalnizca register() yanitinda dolu gelir; login() yanitinda
   * backend bu alani doldurmaz (undefined/null olabilir). Dashboard'un "programin hazirlaniyor"
   * bos durumunu gosterip gostermeyecegine karar vermek icin kullanilir.
   */
  personalizationStatus?: string | null;
  /**
   * E-posta dogrulandi mi. Dogrulanmamis hesaplar giris yapabilir ama uygulama, 6 haneli kod girilene
   * kadar kod ekranindan ileri gecirmez (bkz. pages/auth/verify-email, EmailVerificationGate).
   */
  emailConfirmed?: boolean;
  /**
   * Fitness profili (boy, kilo, hedef...) dolu mu. Yalnizca alisveris icin kayit olan kullanicida false;
   * uygulama bu kullaniciyi giriste MB Shop'a goturur. Eski backend gondermezse undefined.
   */
  fitnessProfileCompleted?: boolean;
  /** Yalnizca register yanitinda: dogrulama kodu e-postasi gonderildiyse true, gonderilemediyse false. */
  verificationEmailSent?: boolean | null;
  /** Bu istekte yeni hesap olusturulduysa true (register, Google ile kayit). Girislerde false. */
  isNewUser?: boolean;
};

// ---- Google ile giris / kayit (MerfitCustomerApi GoogleAuthDtos) ----
/** Google ID token'indan okunan, onboarding'i on doldurmak icin kullanilan bilgiler. */
export type GoogleProfile = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

/**
 * POST /api/auth/google. Hesap varsa (veya ayni dogrulanmis e-postali hesaba baglandiysa) auth doludur;
 * yoksa registrationRequired=true ve profile ile onboarding'e gecilir.
 */
export type GoogleSignInResponse = {
  registrationRequired: boolean;
  auth?: AuthResponse | null;
  profile?: GoogleProfile | null;
};

/** POST /api/auth/google/register - onboarding alanlari + Google ID token; e-posta ve parola yok. */
export type GoogleRegisterRequest = Omit<RegisterRequest, "email" | "password" | "confirmPassword"> & {
  idToken: string;
};

// ---- E-posta dogrulama / sifre sifirlama (MerfitCustomerApi AccountEmailDtos) ----
/** POST /api/auth/email-verification/resend */
export type ResendVerificationEmailResponse = {
  alreadyVerified: boolean;
  sent: boolean;
  /** Bir sonraki tekrar gonderimin yapilabilecegi sure (saniye). */
  resendAvailableInSeconds: number;
};

/** POST /api/auth/email-verification/confirm */
export type ConfirmEmailResponse = {
  email: string;
  emailConfirmed: boolean;
};

/** POST /api/auth/password/forgot | /password/reset/validate | /password/reset */
export type AccountActionResponse = {
  message: string;
};

export type ResetPasswordRequest = {
  email: string;
  /** E-postayla gelen 6 haneli kod. */
  code: string;
  newPassword: string;
  confirmPassword: string;
};

export type UsernameAvailabilityResponse = {
  /** Kontrol edilen kullanici adi (kucuk harf, bosluksuz). */
  username: string;
  available: boolean;
  /** Bicim hatasi veya "alinmis" aciklamasi. */
  message?: string | null;
};

export type LoginRequest = {
  emailOrUsername: string;
  password: string;
};

/**
 * POST /api/auth/register - MerfitCustomerApi.Business.Dtos.Auth.RegisterRequest ile birebir eslesir.
 * Alanlar OnboardingData'daki (bkz. app/pages/onboarding/types.ts) adimlarla dogrudan doldurulur.
 */
export type RegisterRequest = {
  firstName: string;
  lastName: string;
  /**
   * Kullanicinin AccountStep'te kendi belirledigi kullanici adi. Backend UserProfile.Username'e
   * dogrudan yazilir (harf/rakam/alt cizgi, 3-30 karakter - bkz. RegisterRequest.cs validasyonu).
   */
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender?: "male" | "female" | null;
  age?: number | null;
  heightUnit: "cm" | "ft_in";
  heightCm?: number | null;
  heightFeet?: number | null;
  heightInches?: number | null;
  weightUnit: "kg" | "lb";
  weight?: number | null;
  goal?: FitnessGoalCode | null;
  /** Opsiyonel: kullanicinin bildigi vucut yag orani (%). */
  bodyFatPercentage?: number | null;
  /** Opsiyonel cevre olcumleri (cm); yag orani tahmini (US Navy) icin. */
  neckCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  /**
   * Yag Kaybi secilip yag orani dusuk araliktaysa backend 409 (LOW_BODY_FAT_CONFIRMATION_REQUIRED)
   * doner; kullanici uyariyi onaylarsa istek true ile tekrar gonderilir.
   */
  confirmLowBodyFatWarning?: boolean | null;
  activityLevel?: string | null;
  trainingExperience?: string | null;
  trainingDays?: number | null;
  trainingLocation?: string | null;
  /** Backend'de Equipment tablosunun sayisal Id'lerini bekler; EquipmentStep, secenekleri
   * GET /api/equipment'ten urettigi icin secilen Id'ler dogrudan buraya konur. */
  equipmentIds?: number[] | null;
  /**
   * Yalnizca MB Shop'ta alisveris icin kayit: true ise fitness alanlari (boy, kilo, hedef...) sorulmaz ve
   * backend bunlari yok sayar. Kullanici MB Fit'i actiginda POST /api/profile/fitness ile profilini tamamlar.
   */
  shoppingOnly?: boolean | null;
};

/**
 * POST /api/profile/fitness - yalnizca alisveris icin kayit olmus kullanicinin fitness profilini tamamlamasi.
 * Kayit istegindeki fitness alanlariyla ayni (backend FitnessProfileRequest); boy ve kilo zorunlu.
 */
export type FitnessProfileRequest = Omit<
  RegisterRequest,
  "firstName" | "lastName" | "username" | "email" | "password" | "confirmPassword" | "shoppingOnly"
>;

// ---- Equipment ----
/** GET /api/equipment - onboarding'deki EquipmentStep secenekleri bu listeden uretilir;
 * secilen ogelerin `id` degerleri register isteginde equipmentIds olarak gonderilir. */
export type EquipmentListItem = {
  id: number;
  name: string;
  slug: string;
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

// ---- Personalization (Faz 2) ----
/**
 * GET /api/personalization/status - MerfitCustomerApi.Business.Dtos.Customer.Personalization.PersonalizationStatusDto
 * ile birebir eslesir. Kayit sonrasi arka planda calisan kisisellestirme isinin durumunu tasir.
 */
export type PersonalizationStatus = "Pending" | "Processing" | "Completed" | "Failed";

export type PersonalizationStatusResponse = {
  hasJob: boolean;
  status: PersonalizationStatus | null;
  attemptCount: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
};

// ---- My Plan (kisisel antrenman programi - Faz 2) ----
export type MyPlanWorkout = {
  id: number;
  title: string;
  durationMin: number;
  imageUrl: string | null;
  /**
   * Antrenman ozellik puanlari. Backend (feature/workout-attribute-scoring dahil) bu alani
   * customer DTO'larinda HENUZ DONMUYOR; eski yanitlarda alan hic gelmez. Gonderildiginde
   * normalizeWorkoutAttributeScores ile okunur, eksik puan 0 sayilmaz.
   */
  attributeScores?: WorkoutAttributeScoreDto[] | null;
};

export type MyPlanExercise = {
  exerciseId: number;
  name: string;
  order: number;
  sets: number;
  /** Tekrar araliginin alt siniri (veya tek hedef). */
  reps: number | null;
  /** Tekrar araliginin ust siniri; aralik yoksa null/undefined. */
  repsMax?: number | null;
  restSeconds: number | null;
  durationSeconds: number | null;
  /** Egzersiz gorseli (katalogdan); yoksa veya eski backend ise null/undefined. */
  imageUrl?: string | null;
};

export type MyPlanDay = {
  dayOfWeek: string;
  workout: MyPlanWorkout;
  exercises: MyPlanExercise[];
  /** Ana antrenmandan sonra yapilacak kardiyo bitirici (ayri katalog antrenmani); yoksa null. */
  cardioFinisher?: MyPlanWorkout | null;
};

/** GET /api/my-plan */
export type MyWorkoutPlanResponse = {
  id: number;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  summary: string | null;
  days: MyPlanDay[];
} | null;

/** GET /api/my-plan/today */
export type MyTodayWorkoutPlanResponse = {
  hasWorkoutToday: boolean;
  hasActivePlan: boolean;
  day: MyPlanDay | null;
  workoutPlanDayId: number | null;
  /** Bugunun plan antrenmani bugun zaten tamamlandiysa true (eski backend gondermiyorsa undefined). */
  isCompletedToday?: boolean;
};

// ---- My Nutrition Plan (kisisel beslenme programi - Faz 2) ----
export type MyNutritionPlanMealItem = {
  foodId: number;
  foodName: string;
  quantity: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MyNutritionPlanMeal = {
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  name: string;
  plannedTime: string | null;
  notes: string | null;
  items: MyNutritionPlanMealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
};

export type MyNutritionPlanDay = {
  dayOfWeek: string;
  meals: MyNutritionPlanMeal[];
};

/** GET /api/my-nutrition-plan */
export type MyNutritionPlanResponse = {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  summary: string | null;
  days: MyNutritionPlanDay[];
} | null;

/** GET /api/my-nutrition-plan/today */
export type MyTodayNutritionPlanResponse = {
  hasPlanToday: boolean;
  hasActivePlan: boolean;
  day: MyNutritionPlanDay | null;
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
  /**
   * Antrenman ozellik puanlari. Backend (feature/workout-attribute-scoring dahil) bu alani
   * customer DTO'larinda HENUZ DONMUYOR; eski yanitlarda alan hic gelmez. Gonderildiginde
   * normalizeWorkoutAttributeScores ile okunur, eksik puan 0 sayilmaz.
   */
  attributeScores?: WorkoutAttributeScoreDto[] | null;
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
export type WorkoutSessionStatus =
  | "Started"
  | "Paused"
  | "Completed"
  | "Cancelled"
  | "Abandoned";

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
  /** Tekrar araliginin ust siniri (kisisel plan); aralik yoksa null/undefined. */
  targetRepsMax?: number | null;
  restSeconds: number | null;
  durationSeconds: number | null;
  videoUrl: string | null;
  imageUrl: string | null;
  completedSets: WorkoutSetLogEntry[];
  previousBest: PreviousBest | null;
  /** true: harici agirlik gerektirir, 0/bos agirlik kabul edilmez. false: vucut agirligi (agirlik opsiyonel). */
  requiresWeight: boolean;
  /** Bu egzersizin en son tamamlanan oturumdaki setleri ("Geçen sefer"); hic yapilmadiysa null. */
  lastPerformance: LastPerformance | null;
  /** Cift progresyon onerisi (bir sonraki hedef); eski backend gondermiyorsa undefined. */
  progression?: ProgressionSuggestion | null;
};

/** Backend ProgressiveOverloadAdvisor onerisi. */
export type ProgressionSuggestion = {
  action: "start" | "increase_weight" | "keep_weight" | "increase_reps";
  previousWeightKg: number | null;
  suggestedWeightKg: number | null;
  increaseKg: number | null;
  targetRepsMin: number;
  targetRepsMax: number;
  /** Kullaniciya gosterilecek kisa metin. */
  message: string;
};

export type LastPerformance = {
  sessionId: number;
  completedAt: string;
  sets: WorkoutSetLogEntry[];
};

/** GET /api/workout-sessions - antrenman gecmisi listesindeki tek bir tamamlanmis oturum. */
export type WorkoutHistoryItem = {
  id: number;
  workoutId: number;
  title: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number | null;
  caloriesBurned: number | null;
  exerciseCount: number;
  setCount: number;
  totalVolumeKg: number;
  maxWeightKg: number | null;
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

export type MealEntryType =
  | "Kahvaltı"
  | "Öğle Yemeği"
  | "Akşam Yemeği"
  | "Atıştırmalık";

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
  /** Hedeflerle tuketimin sunucuda yapilan karsilastirmasi (ekranin altindaki asistan karti). Eski backend'de yok. */
  insight?: NutritionInsight;
};

// ---- Nutrition Assistant (Mbfit Beslenme Asistani) ----
export type NutritionInsightStatus =
  | "noData"
  | "noTargets"
  | "goalsCompleted"
  | "caloriesExceeded"
  | "proteinBehind"
  | "fatsHigh"
  | "carbsHigh"
  | "caloriesMostlyDone"
  | "carbsOnTrack"
  | "inProgress";

export type NutritionInsight = {
  status: NutritionInsightStatus;
  message: string;
  suggestedQuestion?: string | null;
};

/** Sohbet mesaji; icerik duz metindir (HTML/Markdown olarak yorumlanmaz). */
export type AssistantMessage = {
  /** Sunucunun her acilista urettigi karsilama mesajinda null. */
  id: number | null;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type AssistantConversationResponse = {
  conversationId: number | null;
  date: string; // "yyyy-MM-dd"
  assistantAvailable: boolean;
  greeting: AssistantMessage;
  messages: AssistantMessage[];
  suggestedQuestions: string[];
  insight: NutritionInsight;
  remainingMessages: number;
};

export type AssistantChatRequest = {
  message: string;
  conversationId?: number | null;
  date?: string; // "yyyy-MM-dd"
};

export type AssistantChatResponse = {
  conversationId: number;
  date: string;
  userMessage: AssistantMessage;
  message: AssistantMessage;
  suggestedQuestions: string[];
  remainingMessages: number;
};

/** Backend'in Domain.Enums.MealType degerleri; POST /api/nutrition/meals bu degerleri bekler. */
export type ApiMealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export type LogMealItemRequest = {
  date?: string; // "yyyy-MM-dd"
  mealType: ApiMealType;
  foodId: number;
  /** Porsiyon carpani (food.servingSize'a gore). amount verilirse kullanilmaz. */
  quantity?: number;
  /** Besinin kendi biriminde miktar (g veya ml); yalnizca g/ml birimli besinlerde. */
  amount?: number;
};

/** GET /api/nutrition/meals/{id} - gunlukteki kaydin duzenleme detayi. */
export type MealItemDetail = {
  id: number;
  type: MealEntryType;
  name: string;
  calories: number;
  /** Porsiyon carpani (food.servingSize'a gore). */
  quantity: number;
  /** g/ml birimli besinlerde tuketilen miktar; digerlerinde null. */
  amount: number | null;
  /** Kaydin porsiyon basina degerleri (kayit anindaki anlik goruntu). */
  food: FoodListItem;
};

/** PUT /api/nutrition/meals/{id} govdesi; amount verilirse quantity kullanilmaz. */
export type UpdateMealItemRequest = { quantity?: number; amount?: number };

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
export type ProgressGoalType = FitnessGoalCode;

export type ProgressWeightPoint = { date: string; isoDate: string; weight: number };

export type ProgressBodyMetric = { id: string; label: string; value: string };

/** Yag orani / bel cevresi gecmisindeki tek nokta; isEstimated, cevre olcumlerinden hesaplanan tahmindir. */
export type ProgressBodyMetricPoint = { date: string; isoDate: string; value: number; isEstimated: boolean };

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
  /** Kilo hedeflerinde baslangictan hedefe kat edilen yol (0-100); antrenman hedeflerinde null. */
  goalPercent: number | null;
  /** Hedef kiloya ulasmak icin kilonun gitmesi gereken yon. */
  weightDirection: WeightDirection;
  workoutsCompleted: number | null;
  workoutsGoal: number | null;
  currentWeight: number;
  startingWeight: number;
  targetWeight: number;
  /** Bugun girilen kilo; giris yoksa null. */
  todayWeight: number | null;
  monthlyChange: number;
  workouts: number;
  calories: number;
  streak: number;
  trainingMinutes: number;
  weeklyWorkouts: boolean[];
  weightHistory: ProgressWeightPoint[];
  bodyMetrics: ProgressBodyMetric[];
  /** Secilen araliktaki yag orani olcumleri (eski API surumlerinde yok). */
  bodyFatHistory?: ProgressBodyMetricPoint[];
  /** Secilen araliktaki bel cevresi olcumleri (cm). */
  waistHistory?: ProgressBodyMetricPoint[];
  recentActivity: ProgressRecentActivity[];
  score: ProgressScoreSummary | null;
};

export type ProgressRange = "week" | "month" | "3months" | "year";

export type WeightDirection = "lose" | "gain" | "maintain";

/** POST /api/progress/weight - gunluk kilo girisi (ayni gune ikinci giris oncekini gunceller). */
export type LogWeightRequest = {
  weightKg: number;
  date?: string; // "yyyy-MM-dd"
};

export type LogWeightResponse = {
  date: string;
  weightKg: number;
  targetWeight: number | null;
};

// ---- Leaderboard ----
export type LeaderboardPeriod = "week" | "month" | "allTime";

export type LeaderboardCurrentUserSummary = {
  id: string;
  name: string;
  points: number;
  /** Secili donemdeki sira; donemde hic puani yoksa null. */
  rank: number | null;
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

export type LeaderboardScoreBreakdownItem = {
  id: string;
  label: string;
  points: number;
};
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
  imageUrl: string | null;
  value: string | null;
};

/** Kullanicinin kazandigi hediye (admin donem sonunda dagitir). */
export type LeaderboardEarnedReward = {
  id: number;
  rank: number | null;
  title: string;
  description: string;
  icon: string;
  imageUrl: string | null;
  value: string | null;
  status: "pending" | "claimed" | "expired";
  earnedAt: string;
  claimedAt: string | null;
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
  earnedRewards: LeaderboardEarnedReward[];
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
  /** E-posta dogrulandi mi; e-posta degistirilince false olur. */
  emailConfirmed?: boolean;
  /** Fitness profili dolu mu; yalnizca alisveris icin kayit olanlarda false. Eski backend gondermez. */
  fitnessProfileCompleted?: boolean;
  dateOfBirth: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  targetWeight: number;
  goal: string;
  experienceLevel: string;
  equipment: string;
  trainingLocation: string | null;
  workoutDurationMin: number;
  trainingDaysPerWeek: number;
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
  /**
   * Yag Kaybi secilirken yag orani dusuk aralikta gorunuyorsa backend 409 (LOW_BODY_FAT_CONFIRMATION_REQUIRED)
   * doner; kullanici uyariyi onaylarsa hedef bu alan true olarak tekrar gonderilir.
   */
  confirmLowBodyFatWarning?: boolean;
};

// ---- Notifications ----
export type NotificationCategory = "workout" | "nutrition" | "general" | "shop";

/** Bildirimin ait oldugu bolum. MB FIT ve MB Shop bildirimleri ayri gelen kutularinda ve ayri ayarlarda. */
export type NotificationApp = "mbfit" | "mbshop";

/** GET /api/notifications listesindeki tek bildirim. */
export type NotificationItem = {
  id: number;
  /** Backend NotificationType adi (orn. "WorkoutReminder"). */
  type: string;
  category: NotificationCategory;
  /** Eski backend surumlerinde gelmeyebilir; yoksa "mbfit" kabul edilir. */
  app?: NotificationApp;
  title: string;
  body: string;
  imageUrl: string | null;
  isRead: boolean;
  createdAt: string;
  /** Yonlendirme verisi (orn. { screen: "nutrition" }); yalnizca izinli ekranlara gidilir. */
  data?: Record<string, string>;
};

/** GET/PUT /api/notifications/preferences - push ana anahtari, sessiz saatler ve saat dilimi. */
export type NotificationPreferences = {
  pushEnabled: boolean;
  /** "SS:dd" (kullanicinin yerel saati) veya null. */
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  /** Kayitli IANA saat dilimi; null ise backend varsayilani kullanilir. */
  timeZone: string | null;
  /** Zamanlamada fiilen kullanilan saat dilimi. */
  effectiveTimeZone: string;
};

export type UpdateNotificationPreferencesRequest = {
  pushEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timeZone?: string | null;
};

/** PUT /api/notifications/devices - kullanici kimligi backend'de JWT'den alinir, govdede gonderilmez. */
export type RegisterDeviceRequest = {
  token: string;
  platform: "ios" | "android";
  installationId?: string | null;
  deviceName?: string | null;
  appVersion?: string | null;
  osVersion?: string | null;
  timeZone?: string | null;
};

export type DeviceDeactivationReason = "Logout" | "PermissionRevoked";

/** GET /api/notifications/settings - backend'deki her NotificationType icin bir satir. */
export type NotificationTypeSetting = {
  type: string;
  title: string;
  description: string;
  category: NotificationCategory;
  /** Eski backend surumlerinde gelmeyebilir; yoksa kategoriden ("shop") turetilir. */
  app?: NotificationApp;
  isEnabled: boolean;
  /** true ise kullanici kapatamaz. */
  isLocked: boolean;
};

// ---- Subscription ----
/** GET /api/subscription - MerfitCustomerApi.Business.Dtos.Customer.Subscriptions.SubscriptionProductDto */
export type SubscriptionProductItem = {
  id: number;
  code: string;
  name: string;
  billingPeriod: "Monthly" | "Yearly";
  price: number;
  currency: string;
  storeProductIdIos: string | null;
  storeProductIdAndroid: string | null;
  features: string[];
};

export type SubscriptionInfo = {
  status: "Active" | "Expired" | "Cancelled" | "Refunded" | "Paused" | "GracePeriod";
  provider: "Apple" | "Google";
  startedAt: string;
  expiresAt: string | null;
  autoRenew: boolean;
  cancelledAt: string | null;
  product: SubscriptionProductItem | null;
};

/** GET /api/subscription - kullanicinin Plus uyeligi ve satin alinabilir planlar. */
export type MySubscriptionResponse = {
  isPlus: boolean;
  current: SubscriptionInfo | null;
  products: SubscriptionProductItem[];
};

// ---- Mini oyun (Dumbbell Dash) ----
/** MerfitCustomerApi MiniGameRewardTierDto: bu skora ulasan oyun `points` MB FIT puani kazanir. */
export type MiniGameRewardTier = { minScore: number; points: number };

export type MiniGameRewardRules = {
  tiers: MiniGameRewardTier[];
  maxPointsPerGame: number;
  dailyPointLimit: number;
};

/** POST /api/mini-games/dumbbell-dash/sessions yaniti. */
export type MiniGameSession = {
  /** false ise odul sistemi kapali: oyun puansiz oynanir, sessionId/seed null gelir. */
  rewardsEnabled: boolean;
  sessionId: number | null;
  /** Sunucunun urettigi 32 bit isaretsiz seed. */
  seed: number | null;
  engineVersion: number;
  expiresAt: string | null;
  rules: MiniGameRewardRules;
  earnedToday: number;
  remainingToday: number;
};

export type MiniGameResultStatus =
  | "Rewarded"
  | "NoReward"
  | "DailyLimitReached"
  | "Rejected"
  | "Expired"
  | "Abandoned";

/** POST /api/mini-games/dumbbell-dash/sessions/{id}/finish yaniti (ayni oturum tekrar gonderilirse ayni sonuc). */
export type MiniGameResult = {
  sessionId: number;
  status: MiniGameResultStatus;
  verifiedScore: number | null;
  tierPoints: number;
  awardedPoints: number;
  dailyLimitReached: boolean;
  previousTotalPoints: number;
  totalPoints: number;
  earnedToday: number;
  remainingToday: number;
  nextTier: MiniGameRewardTier | null;
};

/** Oyun sonucu: skor yalnizca iddiadir; sunucu oyunu seed + flapTicks ile yeniden oynatarak dogrular. */
export type FinishMiniGameRequest = {
  score: number;
  ticks: number;
  flapTicks: number[];
};

// ---- Fotograftan kalori analizi (POST /api/food-analysis/analyze) ----
// Tum degerler tahminidir; sonuc otomatik kaydedilmez, kullanici onaylayinca /confirm cagrilir.
export type FoodAnalysisNutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodAnalysisItem = FoodAnalysisNutrients & {
  /** Analiz icindeki sira (1'den baslar); onayda yemegi tanimlar. */
  itemId: number;
  foodName: string;
  estimatedGrams: number;
  minGrams: number;
  maxGrams: number;
  /** 100 g icin degerler; porsiyon degisince toplam bunlarla hesaplanir. */
  per100g: FoodAnalysisNutrients;
  /** Tanima guveni (0-1). */
  confidence: number;
  portionUncertainty: "low" | "medium" | "high";
  needsPortionConfirmation: boolean;
  isEstimate: boolean;
  /** "catalog": dogrulanmis besin katalogu, "ai_estimate": model tahmini. */
  nutritionSource: "catalog" | "ai_estimate";
  matchedFoodName?: string | null;
  matchedFoodId?: number | null;
  note?: string | null;
};

export type FoodAnalysisResult = {
  analysisId: number;
  foodName: string;
  items: FoodAnalysisItem[];
  totals: FoodAnalysisNutrients & { estimatedGrams: number };
  confidence: number;
  isEstimate: boolean;
  needsPortionConfirmation: boolean;
  warnings: string[];
  unidentifiedItems: string[];
  remainingAnalyses: number;
  /** Bu analizin kaydedilebilecegi son an (UTC, ISO). */
  confirmBefore: string;
};

/** GET /api/food-analysis/status - analiz oncesi bilgi; kotadan dusmez. */
export type FoodAnalysisStatus = {
  enabled: boolean;
  /** Fotografin hangi saglayiciya gittigi ve nasil kullanilabilecegi; analiz oncesi gosterilir. */
  dataNotice: string;
  dailyLimit: number;
  remainingAnalyses: number;
};

export type ConfirmFoodAnalysisRequest = {
  date?: string; // "yyyy-MM-dd"
  mealType: ApiMealType;
  items: { itemId: number; grams: number }[];
};

export type ConfirmFoodAnalysisResponse = {
  analysisId: number;
  /** true: bu analiz daha once kaydedilmisti; yeni kayit olusmadi, ilk kaydin sonucu dondu. */
  alreadyLogged: boolean;
  entries: MealEntry[];
};

// ---- Kampanyalar (GET /api/campaigns) ----
export type CampaignListItem = {
  id: number;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  category: string | null;
  startAt: string | null;
  endAt: string | null;
};

export type CampaignDetail = CampaignListItem & {
  body: string | null;
  linkUrl: string | null;
};

// ---- Rozetler (GET /api/achievements) ----
export type AchievementItem = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  points: number;
  earned: boolean;
  earnedAt: string | null;
};

export type AchievementsResponse = {
  earnedCount: number;
  totalCount: number;
  achievements: AchievementItem[];
  /** Kazanilmis ama kullaniciya henuz gosterilmemis rozetler (kutlama ekrani icin). */
  newlyEarned: AchievementItem[];
};

// ---- Aktivite takvimi (GET /api/progress/calendar) ----
export type CalendarWorkoutSession = {
  id: number;
  title: string;
  completedAt: string;
  durationSeconds: number | null;
  caloriesBurned: number | null;
  exerciseCount: number;
  setCount: number;
};

export type CalendarMeal = {
  type: string;
  calories: number;
  itemCount: number;
};

export type CalendarDay = {
  /** "yyyy-MM-dd" (kullanicinin yerel gunu). */
  date: string;
  isToday: boolean;
  isFuture: boolean;
  /** Aktif programda antrenman gunu mu; program yoksa null. */
  isPlannedWorkoutDay: boolean | null;
  workout: {
    completed: boolean;
    totalDurationSeconds: number;
    sessions: CalendarWorkoutSession[];
  };
  /** Besinlerden ALINAN kalori ve makrolar. */
  nutrition: {
    logged: boolean;
    consumedCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    calorieRatio: number | null;
    calorieGoalMet: boolean;
    meals: CalendarMeal[];
  };
  /** Antrenmanlarda HARCANAN kalori ve aktif sure (adim verisi yok). */
  activity: {
    caloriesBurned: number;
    activeMinutes: number;
  };
};

export type ActivityCalendarResponse = {
  from: string;
  to: string;
  today: string;
  timeZone: string;
  dailyCalorieTarget: number | null;
  calorieGoalLowerRatio: number;
  calorieGoalUpperRatio: number;
  days: CalendarDay[];
};

// ---- Kilo hatirlaticisi (GET /api/progress/weight-reminder) ----
export type WeightReminderResponse = {
  shouldPrompt: boolean;
  intervalDays: number;
  lastLoggedDate: string | null;
  lastWeightKg: number | null;
  snoozedUntil: string | null;
  unitSystem: "metric" | "imperial";
};

export type WeightReminderSnoozeAction = "later" | "dismiss";
