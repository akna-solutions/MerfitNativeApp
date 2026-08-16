export type LeaderboardUser = {
  id: string;
  name: string;
  points: number;
  workouts: number;
  isCurrentUser?: boolean;
};

export type LeaderboardEntry = LeaderboardUser & { rank: number };

export type CurrentUserSummary = {
  id: string;
  name: string;
  points: number;
  weeklyChange: number;
  bestRank: number;
  bestRankMonthLabel: string;
  league: string;
  leaderboardVisible: boolean;
};

export type PeriodFilter = "week" | "month" | "allTime";

export type ScoreHistoryPoint = { label: string; points: number };

export type ScoreBreakdownItem = { id: string; label: string; points: number };

export type AchievementIcon = "streak" | "workouts" | "pr" | "weekly";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  earned: boolean;
};

export type RewardIcon =
  | "watch"
  | "premium"
  | "bag"
  | "shoes"
  | "training"
  | "shaker"
  | "apparel"
  | "membership";

export type Reward = {
  rank: number;
  title: string;
  description: string;
  icon: RewardIcon;
};
