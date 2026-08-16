export type Membership = "FREE" | "PLUS";

// Tüm Plus-only özellikler burada tanımlı. Yeni bir premium özellik
// eklerken sadece bu union'a ve featureRegistry.ts'e ekleme yapman yeterli.
export type PlusFeature =
  | "ADVANCED_PROGRESS"
  | "AI_WORKOUT"
  | "AI_NUTRITION"
  | "PERSONAL_INSIGHTS"
  | "ADVANCED_ANALYTICS"
  | "DETAILED_SCORE"
  | "ADVANCED_LEADERBOARD";
