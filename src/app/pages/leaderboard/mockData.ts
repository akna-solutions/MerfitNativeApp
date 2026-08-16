import {
    Achievement,
    CurrentUserSummary,
    LeaderboardEntry,
    LeaderboardUser,
    Reward,
    ScoreBreakdownItem,
    ScoreHistoryPoint,
} from "./types";

// TODO: Backend/API bağlandığında bu mock objeleri gerçek fetch/query
// sonucuyla değiştir. Component'ler bu şekilleri beklediği için veri
// kaynağı değişse bile prop arayüzü aynı kalır.

export const MOCK_CURRENT_USER: CurrentUserSummary = {
  id: "me",
  name: "Mert",
  points: 8420,
  weeklyChange: 240,
  bestRank: 92,
  bestRankMonthLabel: "August 2026",
  league: "Silver",
  leaderboardVisible: true,
};

const TOP_USERS_RAW: LeaderboardUser[] = [
  { id: "u1", name: "Alex", points: 12840, workouts: 124 },
  { id: "u2", name: "Selin", points: 12420, workouts: 118 },
  { id: "u3", name: "Kaan", points: 11980, workouts: 110 },
  { id: "u4", name: "Aylin", points: 11540, workouts: 105 },
  { id: "u5", name: "Baran", points: 11180, workouts: 101 },
  { id: "u6", name: "Nil", points: 10820, workouts: 98 },
  { id: "u7", name: "Onur", points: 10460, workouts: 95 },
  { id: "u8", name: "Ece", points: 10120, workouts: 92 },
  { id: "u9", name: "Cem", points: 9960, workouts: 90 },
  { id: "u10", name: "Zeynep", points: 9840, workouts: 88 },
];

const NEARBY_USERS_RAW: LeaderboardUser[] = [
  { id: "u181", name: "Ahmet", points: 8470, workouts: 74 },
  { id: "u182", name: "Can", points: 8455, workouts: 72 },
  { id: "u183", name: "Derya", points: 8440, workouts: 71 },
  { id: "me", name: "Mert", points: 8420, workouts: 70, isCurrentUser: true },
  { id: "u185", name: "Efe", points: 8410, workouts: 69 },
  { id: "u186", name: "Burak", points: 8395, workouts: 68 },
];

/** Rank her zaman puana göre sıralanarak hesaplanır - hiçbir yerde hard-code edilmez. */
function withComputedRank(
  users: LeaderboardUser[],
  startRank: number,
): LeaderboardEntry[] {
  return [...users]
    .sort((a, b) => b.points - a.points)
    .map((user, index) => ({ ...user, rank: startRank + index }));
}

export const TOP_10_TURKIYE: LeaderboardEntry[] = withComputedRank(
  TOP_USERS_RAW,
  1,
);

export const NEARBY_USERS: LeaderboardEntry[] = withComputedRank(
  NEARBY_USERS_RAW,
  181,
);

export const CURRENT_USER_ENTRY: LeaderboardEntry = NEARBY_USERS.find(
  (entry) => entry.isCurrentUser,
) ?? {
  ...MOCK_CURRENT_USER,
  workouts: 0,
  rank: 184,
};

export const TOTAL_RANKED_USERS = 2280; // mock evren büyüklüğü - "Top %8" hesaplaması için
export const TOP_PERCENT = Math.max(
  1,
  Math.round((CURRENT_USER_ENTRY.rank / TOTAL_RANKED_USERS) * 100),
);

export const SCORE_BREAKDOWN: ScoreBreakdownItem[] = [
  { id: "consistency", label: "Workout Consistency", points: 3200 },
  { id: "completion", label: "Workout Completion", points: 2400 },
  { id: "progress", label: "Progress", points: 1200 },
  { id: "nutrition", label: "Nutrition Consistency", points: 900 },
  { id: "streak", label: "Streak", points: 520 },
  { id: "challenges", label: "Challenges", points: 200 },
];

export const SCORE_HISTORY: ScoreHistoryPoint[] = [
  { label: "Mon", points: 8180 },
  { label: "Tue", points: 8215 },
  { label: "Wed", points: 8250 },
  { label: "Thu", points: 8290 },
  { label: "Fri", points: 8330 },
  { label: "Sat", points: 8375 },
  { label: "Sun", points: 8420 },
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "streak-7",
    title: "7 Day Streak",
    description: "Trained 7 days in a row",
    icon: "streak",
    earned: true,
  },
  {
    id: "workouts-10",
    title: "10 Workouts",
    description: "Completed 10 workouts",
    icon: "workouts",
    earned: true,
  },
  {
    id: "first-pr",
    title: "First PR",
    description: "Beat your personal best",
    icon: "pr",
    earned: true,
  },
  {
    id: "weekly-5",
    title: "5 Workouts This Week",
    description: "3 of 5 completed",
    icon: "weekly",
    earned: false,
  },
];

export const REWARDS: Reward[] = [
  {
    rank: 1,
    title: "Fitness Smartwatch",
    description: "Track every workout with precision.",
    icon: "watch",
  },
  {
    rank: 2,
    title: "MERFIT Premium — 6 Months",
    description: "Full access to MERFIT Premium.",
    icon: "premium",
  },
  {
    rank: 3,
    title: "Premium Gym Bag",
    description: "Built for your training days.",
    icon: "bag",
  },
  {
    rank: 4,
    title: "Sports Shoes Voucher",
    description: "Toward premium training shoes.",
    icon: "shoes",
  },
  {
    rank: 5,
    title: "1 Month Personal Training",
    description: "One-on-one coaching session.",
    icon: "training",
  },
  {
    rank: 6,
    title: "MERFIT Premium — 3 Months",
    description: "Full access to MERFIT Premium.",
    icon: "premium",
  },
  {
    rank: 7,
    title: "Premium Protein Shaker",
    description: "Your everyday training companion.",
    icon: "shaker",
  },
  {
    rank: 8,
    title: "Fitness Apparel Voucher",
    description: "Toward MERFIT training apparel.",
    icon: "apparel",
  },
  {
    rank: 9,
    title: "Gym Membership Voucher",
    description: "One month at a partner gym.",
    icon: "membership",
  },
  {
    rank: 10,
    title: "MERFIT Premium — 1 Month",
    description: "Full access to MERFIT Premium.",
    icon: "premium",
  },
];

// Mock geri sayım hedefi - modül yüklendiğinde bir kere hesaplanır.
// Gerçek backend geldiğinde bu bir API alanı olacak.
export const REWARDS_RESET_AT = new Date(
  Date.now() + 12 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000 + 42 * 60 * 1000,
);
