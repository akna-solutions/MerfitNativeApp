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

// Icon degerleri artik backend'deki Achievement.Icon / Reward.RewardType (serbest metin)
// alanlarindan geldigi icin sabit union yerine string olarak tanimlandi. UI tarafindaki
// ICONS eslemesi (bkz. Achievements.tsx, RewardCard.tsx) gercek veri backend'deki
// degerlerle birebir eslesecek sekilde kalmali; bilinmeyen bir deger gelirse fallback kullanilir.
export type AchievementIcon = string;

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  earned: boolean;
};

export type RewardIcon = string;

export type Reward = {
  rank: number;
  title: string;
  description: string;
  icon: RewardIcon;
};
