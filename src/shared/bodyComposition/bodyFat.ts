/**
 * Vucut yag orani kurallari: MerfitCustomerApi'deki BodyFatEstimator, BodyFatAssessor ve
 * LowBodyFatGoalGuard ile birebir ayni. Sunucu her kayitta ve hedef degisikliginde kurali yeniden
 * uygular; buradaki kopya yalnizca onboarding'de olcumler henuz sunucuya gitmeden uyariyi gostermek icindir.
 * Esikler degisirse iki tarafin birlikte guncellenmesi gerekir.
 */
import type { FitnessGoalCode } from "../../services/api/types";

export type BodyFatGender = "male" | "female";

export type BodyFatCategory = "low" | "healthy" | "high" | "unknown";

export type BodyFatSource = "measured" | "estimated";

/** Sunucunun 409 yanitinda dondurdugu hata kodu. */
export const LOW_BODY_FAT_CONFIRMATION_CODE = "LOW_BODY_FAT_CONFIRMATION_REQUIRED";

/** Uyari metni; sunucudaki LowBodyFatGoalGuard.WarningMessage ile ayni. */
export const LOW_BODY_FAT_WARNING_MESSAGE =
  "Ölçümlerine göre vücut yağ oranın düşük aralıkta görünüyor. Daha fazla kilo vermek kas kaybı ve sağlık sorunları riskini artırabilir. Hedefini yeniden değerlendirmeyi düşünmeni öneriyoruz. Ölçüm tahmini bir değer olabilir.";

export const LOW_BODY_FAT_RECONSIDER_LABEL = "Hedefimi yeniden değerlendireceğim";
export const LOW_BODY_FAT_CONTINUE_LABEL = "Uyarıyı anladım, devam et";

/** Degerlendirme yapilan en dusuk yas; altinda sonuc uretilmez. */
export const MINIMUM_ASSESSMENT_AGE = 18;

/** US Navy cevre yonteminin yaklasik hata payi (yuzde puan). */
export const ESTIMATED_MARGIN_OF_ERROR = 3.5;

/** Kullanicinin girdigi (cihazdan okunan) degerin varsayilan hata payi (yuzde puan). */
export const MEASURED_MARGIN_OF_ERROR = 4;

type BodyFatRange = { gender: BodyFatGender; minAge: number; maxAge: number; lowBelow: number; highAbove: number };

/**
 * Gallagher D. ve ark., "Healthy percentage body fat ranges", Am J Clin Nutr 2000;72(3):694-701.
 * Sunucudaki BodyCompositionOptions.DefaultRanges ile ayni.
 */
export const BODY_FAT_RANGES: readonly BodyFatRange[] = [
  { gender: "male", minAge: 18, maxAge: 39, lowBelow: 8, highAbove: 20 },
  { gender: "male", minAge: 40, maxAge: 59, lowBelow: 11, highAbove: 22 },
  { gender: "male", minAge: 60, maxAge: 120, lowBelow: 13, highAbove: 25 },
  { gender: "female", minAge: 18, maxAge: 39, lowBelow: 21, highAbove: 33 },
  { gender: "female", minAge: 40, maxAge: 59, lowBelow: 23, highAbove: 34 },
  { gender: "female", minAge: 60, maxAge: 120, lowBelow: 24, highAbove: 36 },
];

export const BODY_MEASUREMENT_LIMITS = {
  bodyFat: { min: 2, max: 75, label: "Vücut yağ oranı %2-75 arasında olmalıdır." },
  neck: { min: 20, max: 80, label: "Boyun çevresi 20-80 cm arasında olmalıdır." },
  waist: { min: 40, max: 250, label: "Bel çevresi 40-250 cm arasında olmalıdır." },
  hip: { min: 50, max: 250, label: "Kalça çevresi 50-250 cm arasında olmalıdır." },
} as const;

export type BodyMeasurementField = keyof typeof BODY_MEASUREMENT_LIMITS;

/** Bos deger gecerlidir (alanlar opsiyonel); dolu ve aralik disiysa hata metni doner. */
export function validateMeasurement(field: BodyMeasurementField, value: number | null): string | null {
  if (value === null) return null;
  const limit = BODY_MEASUREMENT_LIMITS[field];
  return Number.isFinite(value) && value >= limit.min && value <= limit.max ? null : limit.label;
}

/** "12,5" gibi virgullu girdileri de kabul eder; bos veya gecersizse null. */
export function parseDecimal(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/**
 * US Navy (Hodgdon ve Beckett, 1984) yag orani tahmini, 1 ondalik basamak. Cinsiyet erkek/kadin degilse,
 * gerekli olcumlerden biri eksikse veya sonuc %2-75 disindaysa null.
 */
export function estimateUsNavy(
  gender: BodyFatGender | null | undefined,
  heightCm: number | null | undefined,
  neckCm: number | null | undefined,
  waistCm: number | null | undefined,
  hipCm: number | null | undefined,
): number | null {
  if (!heightCm || heightCm <= 0 || !neckCm || neckCm <= 0 || !waistCm || waistCm <= 0) return null;

  let result: number;
  if (gender === "male") {
    const girth = waistCm - neckCm;
    if (girth <= 0) return null;
    result = 495 / (1.0324 - 0.19077 * Math.log10(girth) + 0.15456 * Math.log10(heightCm)) - 450;
  } else if (gender === "female") {
    if (!hipCm || hipCm <= 0) return null;
    const girth = waistCm + hipCm - neckCm;
    if (girth <= 0) return null;
    result = 495 / (1.29579 - 0.35004 * Math.log10(girth) + 0.221 * Math.log10(heightCm)) - 450;
  } else {
    return null;
  }

  if (!Number.isFinite(result)) return null;
  const rounded = Math.round(result * 10) / 10;
  return rounded < 2 || rounded > 75 ? null : rounded;
}

export type BodyFatInput = {
  gender: BodyFatGender | null | undefined;
  age: number | null | undefined;
  heightCm: number | null | undefined;
  /** Kullanicinin girdigi/olctugu yag orani; varsa tahmine tercih edilir. */
  bodyFatPercentage?: number | null;
  neckCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
};

export type BodyFatAssessment = {
  percentage: number | null;
  source: BodyFatSource | null;
  marginOfError: number | null;
  category: BodyFatCategory;
  lowThreshold: number | null;
  highThreshold: number | null;
};

/**
 * Once girilen yag orani, yoksa US Navy tahmini kullanilir. Okuma, yas (18+) veya erkek/kadin cinsiyet
 * yoksa kategori "unknown" olur: eksik bilgiyle dusuk yag orani sonucu uretilmez.
 */
export function assessBodyFat(input: BodyFatInput): BodyFatAssessment {
  const measured = input.bodyFatPercentage && input.bodyFatPercentage > 0 ? input.bodyFatPercentage : null;
  const estimated = measured === null
    ? estimateUsNavy(input.gender, input.heightCm, input.neckCm, input.waistCm, input.hipCm)
    : null;
  const percentage = measured ?? estimated;
  const source: BodyFatSource | null = measured !== null ? "measured" : estimated !== null ? "estimated" : null;

  const age = input.age ?? null;
  const range = age !== null && age >= MINIMUM_ASSESSMENT_AGE && (input.gender === "male" || input.gender === "female")
    ? BODY_FAT_RANGES.find((r) => r.gender === input.gender && age >= r.minAge && age <= r.maxAge) ?? null
    : null;

  const base = {
    percentage,
    source,
    marginOfError: source === "measured" ? MEASURED_MARGIN_OF_ERROR : source === "estimated" ? ESTIMATED_MARGIN_OF_ERROR : null,
    lowThreshold: range?.lowBelow ?? null,
    highThreshold: range?.highAbove ?? null,
  };
  if (percentage === null || range === null) return { ...base, category: "unknown" };

  const category: BodyFatCategory =
    percentage < range.lowBelow ? "low" : percentage > range.highAbove ? "high" : "healthy";
  return { ...base, category };
}

/** Yag Kaybi secildiyse ve yag orani dusuk araliktaysa uyari gosterilir (sunucudaki kuralla ayni). */
export function requiresLowBodyFatWarning(goal: FitnessGoalCode | null | undefined, assessment: BodyFatAssessment): boolean {
  return goal === "lose_weight" && assessment.category === "low";
}

/** ApiError sunucunun dusuk yag orani onayi istedigi 409 yaniti mi. */
export function isLowBodyFatConfirmationError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { status?: number; fieldErrors?: unknown };
  return candidate.status === 409
    && Array.isArray(candidate.fieldErrors)
    && candidate.fieldErrors.includes(LOW_BODY_FAT_CONFIRMATION_CODE);
}
