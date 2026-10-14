import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { ApiError, NetworkError } from "../../../services/api/client";
import { FoodPhotoUpload } from "../../../services/api/foodAnalysis";
import { FoodAnalysisItem, FoodAnalysisNutrients } from "../../../services/api/types";

/** Yuklemeden once fotografin uzun kenari bu boyuta indirilir; yemek tanima icin yeterli, yukleme kucuk kalir. */
export const MAX_PHOTO_DIMENSION = 1280;
export const PHOTO_JPEG_QUALITY = 0.7;
/** Sunucunun kabul ettigi gramaj araligi (ConfirmFoodAnalysisItem). */
export const MIN_GRAMS = 1;
export const MAX_GRAMS = 3000;

export type PhotoSource = "camera" | "library";

export type PickPhotoResult =
  | { status: "picked"; uri: string; width: number; height: number }
  | { status: "canceled" }
  | { status: "denied"; source: PhotoSource; canAskAgain: boolean };

/** Izni ister ve kamerayi ya da galeriyi acar. Izin reddedilirse fotograf secilmez. */
export async function pickFoodPhoto(source: PhotoSource): Promise<PickPhotoResult> {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { status: "denied", source, canAskAgain: permission.canAskAgain };
  }

  // Kirpma kapali: tabagin tamami (porsiyon referansi) gorunsun. Kalite burada degil, yeniden boyutlandirmada dusurulur.
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: false, quality: 1, exif: false };
  const result =
    source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return { status: "canceled" };
  return { status: "picked", uri: asset.uri, width: asset.width, height: asset.height };
}

/** Uzun kenari MAX_PHOTO_DIMENSION'a indirir (buyutmez) ve JPEG olarak sikistirir. HEIC/PNG de JPEG'e cevrilir. */
export async function prepareFoodPhoto(photo: { uri: string; width: number; height: number }): Promise<FoodPhotoUpload> {
  const context = ImageManipulator.manipulate(photo.uri);
  const longest = Math.max(photo.width, photo.height);
  if (longest > MAX_PHOTO_DIMENSION) {
    context.resize(photo.width >= photo.height ? { width: MAX_PHOTO_DIMENSION } : { height: MAX_PHOTO_DIMENSION });
  }
  const image = await context.renderAsync();
  try {
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: PHOTO_JPEG_QUALITY });
    return { uri: saved.uri, mimeType: "image/jpeg", fileName: "meal.jpg" };
  } finally {
    image.release();
    context.release();
  }
}

/** "180", "180,5" ve "180.5" girislerini sayiya cevirir; gecersizse null. */
export function parseGrams(text: string): number | null {
  const value = Number(text.replace(",", ".").trim());
  return Number.isFinite(value) && value >= MIN_GRAMS && value <= MAX_GRAMS ? value : null;
}

/** 100 g degerlerinden verilen gramaj icin besin degerleri. */
export function nutrientsFor(per100g: FoodAnalysisNutrients, grams: number): FoodAnalysisNutrients {
  const factor = grams / 100;
  return {
    calories: per100g.calories * factor,
    protein: per100g.protein * factor,
    carbs: per100g.carbs * factor,
    fat: per100g.fat * factor,
  };
}

/** Secili yemeklerin kullanicinin girdigi gramajlara gore toplami. */
export function computeTotals(
  items: FoodAnalysisItem[],
  grams: Record<number, number | null>,
  selected: Record<number, boolean>,
): FoodAnalysisNutrients & { grams: number } {
  const totals = { grams: 0, calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const item of items) {
    const value = grams[item.itemId];
    if (!selected[item.itemId] || value == null) continue;
    const n = nutrientsFor(item.per100g, value);
    totals.grams += value;
    totals.calories += n.calories;
    totals.protein += n.protein;
    totals.carbs += n.carbs;
    totals.fat += n.fat;
  }
  return totals;
}

/** Analiz hatasini kullaniciya gosterilecek Turkce mesaja cevirir. Sunucunun mesajlari zaten Turkcedir. */
export function analysisErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 413) return "Fotoğraf çok büyük. Lütfen başka bir fotoğraf deneyin.";
    if (error.status === 401) return error.message;
    if (error.status >= 500 && error.status !== 503) return "Fotoğraf şu anda analiz edilemedi. Lütfen tekrar deneyin.";
    return error.message;
  }
  if (error instanceof NetworkError) {
    return "Sunucuya ulaşılamadı ya da analiz çok uzun sürdü. Bağlantınızı kontrol edip tekrar deneyin.";
  }
  return "Fotoğraf hazırlanamadı. Lütfen başka bir fotoğraf deneyin.";
}

/** Ayni fotografla tekrar denemek anlamli mi? (bozuk dosya / yemek yok gibi 400 hatalarinda degil) */
export function isRetryableAnalysisError(error: unknown): boolean {
  if (error instanceof ApiError) return error.status >= 500 || error.status === 408 || error.status === 429;
  return error instanceof NetworkError;
}

/** Sunucuya ulasilamazsa gosterilen bilgilendirme (sunucudaki FoodAnalysis:DataNotice ile ayni anlam). */
export const FALLBACK_DATA_NOTICE =
  "Fotoğrafın analiz için Google Gemini'ye gönderilir ve sunucularımızda saklanmaz. Google, gönderilen içeriği " +
  "hizmetlerini geliştirmek için kullanabilir; fotoğrafta yüzün ya da kişisel bilgin görünmesin. Değerler tahminidir.";

export function formatGrams(value: number): string {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
}

export function formatMacro(value: number): string {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
}
