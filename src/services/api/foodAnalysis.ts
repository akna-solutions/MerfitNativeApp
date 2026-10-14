import { File } from "expo-file-system";
import { Platform } from "react-native";

import { apiRequest } from "./client";
import { ConfirmFoodAnalysisRequest, ConfirmFoodAnalysisResponse, FoodAnalysisResult, FoodAnalysisStatus } from "./types";

/**
 * Analiz yavas bir yapay zeka cagrisidir; sunucu kendi zaman asimini uygular (sira bekleme + saglayici).
 * Istemci sunucudan once vazgecmesin diye genel 15 sn yerine daha uzun bir sure kullanilir.
 */
export const FOOD_ANALYSIS_TIMEOUT_MS = 95_000;

/** Yuklenecek, cihazda hazirlanmis (kucultulmus, JPEG) fotograf. */
export type FoodPhotoUpload = { uri: string; mimeType: "image/jpeg"; fileName: string };

async function toFormData(photo: FoodPhotoUpload): Promise<FormData> {
  const form = new FormData();
  if (Platform.OS === "web") {
    // Web'de dosya nesnesi gerekir; yerel uri Blob'a cevrilir.
    const blob = await (await fetch(photo.uri)).blob();
    form.append("photo", blob, photo.fileName);
  } else {
    // SDK 57'de global fetch expo/fetch'tir; React Native'in { uri, name, type } dosya parcasini desteklemez
    // ("Unsupported FormDataPart implementation"). expo-file-system File'i Blob arayuzunu uygular, dosyayi okuyup gonderir.
    form.append("photo", new File(photo.uri), photo.fileName);
  }
  return form;
}

/** GET /api/food-analysis/status - ozellik acik mi, veri kullanimi bilgilendirmesi ve kalan gunluk hak. */
export async function getFoodAnalysisStatus(signal?: AbortSignal): Promise<FoodAnalysisStatus> {
  return apiRequest<FoodAnalysisStatus>("/api/food-analysis/status", { signal });
}

/** POST /api/food-analysis/analyze - fotograftaki yemekleri tahmin eder. Gunluge kayit YAPMAZ. */
export async function analyzeFoodPhoto(photo: FoodPhotoUpload, signal?: AbortSignal): Promise<FoodAnalysisResult> {
  return apiRequest<FoodAnalysisResult>("/api/food-analysis/analyze", {
    method: "POST",
    body: await toFormData(photo),
    signal,
    timeoutMs: FOOD_ANALYSIS_TIMEOUT_MS,
  });
}

/** POST /api/food-analysis/{id}/confirm - kullanicinin onayladigi porsiyonlari gunluge ekler. */
export async function confirmFoodAnalysis(
  analysisId: number,
  request: ConfirmFoodAnalysisRequest,
): Promise<ConfirmFoodAnalysisResponse> {
  return apiRequest<ConfirmFoodAnalysisResponse>(`/api/food-analysis/${analysisId}/confirm`, {
    method: "POST",
    body: request,
  });
}
