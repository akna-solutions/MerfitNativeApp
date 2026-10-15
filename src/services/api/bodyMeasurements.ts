import { apiRequest } from "./client";

/** MerfitCustomerApi BodyMeasurementDto. Tum degerler metrik (kg, cm, %). */
export type BodyMeasurement = {
  id: number;
  recordedAt: string;
  weightKg: number | null;
  /** Girilen/olculen yag orani. */
  bodyFatPercentage: number | null;
  /** Cevre olcumlerinden hesaplanan tahmini yag orani; ekranda "tahmini" olarak etiketlenir. */
  estimatedBodyFatPercentage: number | null;
  bodyFatEstimationMethod: string | null;
  neckCm: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  bmi: number | null;
};

export type BodyFatAssessmentResponse = {
  percentage: number | null;
  source: "measured" | "estimated" | null;
  method: string | null;
  marginOfErrorPercent: number | null;
  recordedAt: string | null;
  category: "low" | "healthy" | "high" | "unknown";
  lowThreshold: number | null;
  highThreshold: number | null;
  missing: string[];
};

/** GET /api/body-measurements: olcum gecmisi (yeniden eskiye) ve guncel degerlendirme. */
export type BodyMeasurementHistory = {
  heightCm: number | null;
  gender: string | null;
  measurements: BodyMeasurement[];
  bodyFat: BodyFatAssessmentResponse;
  showLowBodyFatWarning: boolean;
  lowBodyFatWarningMessage: string | null;
};

/** POST /api/body-measurements: her istek yeni bir kayit olusturur; gecmis degistirilmez. */
export type CreateBodyMeasurementRequest = {
  /** "yyyy-MM-dd"; verilmezse simdiki zaman. */
  date?: string;
  weightKg?: number | null;
  bodyFatPercentage?: number | null;
  neckCm?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  armCm?: number | null;
  thighCm?: number | null;
};

export function getBodyMeasurements(signal?: AbortSignal): Promise<BodyMeasurementHistory> {
  return apiRequest<BodyMeasurementHistory>("/api/body-measurements", { signal });
}

export function createBodyMeasurement(request: CreateBodyMeasurementRequest): Promise<BodyMeasurementHistory> {
  return apiRequest<BodyMeasurementHistory>("/api/body-measurements", { method: "POST", body: request });
}
