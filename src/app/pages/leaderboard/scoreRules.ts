// Tek merkezi scoring config. İleride backend'e taşınacak; şimdilik
// puan hesaplamaları (workout tamamlama, streak, PR vb.) buradan okunur.
export const SCORE_RULES = {
  workoutCompleted: 100,
  personalRecord: 150,
  sevenDayStreak: 200,
  thirtyDayStreak: 500,
  nutritionGoalCompleted: 50,
  weeklyGoalCompleted: 200,
} as const;

export type ScoreRuleKey = keyof typeof SCORE_RULES;
