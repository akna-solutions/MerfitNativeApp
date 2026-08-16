import { PlusFeature } from "./types";

type FeatureInfo = { title: string; description: string };

// Premium özellikleri koda dağıtmak yerine tek merkezi registry.
// LockedOverlay ve PlusPurchaseModal aynı title/description'ı buradan okur.
export const PLUS_FEATURES: Record<PlusFeature, FeatureInfo> = {
  ADVANCED_PROGRESS: {
    title: "Advanced Progress",
    description: "Understand your performance in detail.",
  },
  AI_WORKOUT: {
    title: "AI Workout Plan",
    description: "Get a workout plan built around your goals and progress.",
  },
  AI_NUTRITION: {
    title: "AI Nutrition Plan",
    description: "Get personalized meals and macro targets for your goal.",
  },
  PERSONAL_INSIGHTS: {
    title: "Personal Insights",
    description: "Get personalized insights based on your progress.",
  },
  ADVANCED_ANALYTICS: {
    title: "Advanced Analytics",
    description: "Unlock detailed performance trends and analytics.",
  },
  DETAILED_SCORE: {
    title: "Detailed MERFIT Score",
    description: "See exactly how your MERFIT score is calculated.",
  },
  ADVANCED_LEADERBOARD: {
    title: "Advanced Leaderboard Insights",
    description: "See your rank history and detailed standing.",
  },
};

// Purchase modal'da gösterilen sabit fayda listesi (max 5-6 madde).
export const PLUS_BENEFITS: string[] = [
  "Advanced Progress Analytics",
  "AI Workout Plans",
  "AI Nutrition Plans",
  "Personal Insights",
  "Detailed MERFIT Score",
  "Advanced Analytics",
];
