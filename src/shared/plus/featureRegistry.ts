import { PlusFeature } from "./types";

type FeatureInfo = { title: string; description: string };

// Premium özellikleri koda dağıtmak yerine tek merkezi registry.
// LockedOverlay ve PlusPurchaseModal aynı title/description'ı buradan okur.
export const PLUS_FEATURES: Record<PlusFeature, FeatureInfo> = {
  ADVANCED_PROGRESS: {
    title: "Gelişmiş İlerleme",
    description: "Performansını detaylı olarak anla.",
  },
  AI_WORKOUT: {
    title: "Yapay Zeka Antrenman Planı",
    description: "Hedeflerine ve ilerlemene göre hazırlanmış bir antrenman planı al.",
  },
  AI_NUTRITION: {
    title: "Yapay Zeka Beslenme Planı",
    description: "Hedefine özel kişiselleştirilmiş öğünler ve makro hedefleri al.",
  },
  PERSONAL_INSIGHTS: {
    title: "Kişisel Öngörüler",
    description: "İlerlemene dayalı kişiselleştirilmiş öngörüler al.",
  },
  ADVANCED_ANALYTICS: {
    title: "Gelişmiş Analizler",
    description: "Detaylı performans trendlerinin ve analizlerin kilidini aç.",
  },
  DETAILED_SCORE: {
    title: "Detaylı MB FIT Skoru",
    description: "MB FIT skorunun tam olarak nasıl hesaplandığını gör.",
  },
  ADVANCED_LEADERBOARD: {
    title: "Gelişmiş Liderlik Tablosu Öngörüleri",
    description: "Sıralama geçmişini ve detaylı durumunu gör.",
  },
};

// Purchase modal'da gösterilen sabit fayda listesi (max 5-6 madde).
export const PLUS_BENEFITS: string[] = [
  "Gelişmiş İlerleme Analizleri",
  "Yapay Zeka Antrenman Planları",
  "Yapay Zeka Beslenme Planları",
  "Kişisel Öngörüler",
  "Detaylı MB FIT Skoru",
  "Gelişmiş Analizler",
];
