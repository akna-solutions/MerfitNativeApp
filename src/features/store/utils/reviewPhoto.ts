import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { ReviewPhoto } from "../types";

/** Sunucu 3 MB ve 6000 px ustunu reddeder; yuklemeden once uzun kenar bu boyuta indirilir ve JPEG'e cevrilir. */
export const REVIEW_PHOTO_MAX_DIMENSION = 1600;
export const REVIEW_PHOTO_QUALITY = 0.8;
/** Sunucudaki StoreReviewRules ile ayni. */
export const MAX_REVIEW_PHOTOS = 5;
export const MIN_COMMENT_LENGTH = 10;
export const MAX_COMMENT_LENGTH = 2000;
export const MAX_TITLE_LENGTH = 100;

export type PickedPhoto = { uri: string; width: number; height: number };
export type PickPhotosResult = { status: "picked"; photos: PickedPhoto[] } | { status: "canceled" } | { status: "denied" };

/** Izin ister; galeriden birden fazla ya da kameradan bir fotograf secer. */
export async function pickReviewPhotos(source: "camera" | "library", limit: number): Promise<PickPhotosResult> {
  const permission =
    source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { status: "denied" };
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 1,
    exif: false,
    allowsMultipleSelection: source === "library" && limit > 1,
    selectionLimit: limit,
  };
  const result = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || result.assets.length === 0) return { status: "canceled" };
  return { status: "picked", photos: result.assets.slice(0, limit).map((a) => ({ uri: a.uri, width: a.width, height: a.height })) };
}

/**
 * Uzun kenari REVIEW_PHOTO_MAX_DIMENSION'a indirir (buyutmez), JPEG'e cevirir. Yeniden kodlama konum gibi EXIF
 * bilgilerini de atar; sunucu ayrica meta veriyi temizler ve bicim/boyut kontrolunu yeniden yapar.
 */
export async function prepareReviewPhoto(photo: PickedPhoto, index: number): Promise<ReviewPhoto> {
  const context = ImageManipulator.manipulate(photo.uri);
  if (Math.max(photo.width, photo.height) > REVIEW_PHOTO_MAX_DIMENSION) {
    context.resize(photo.width >= photo.height ? { width: REVIEW_PHOTO_MAX_DIMENSION } : { height: REVIEW_PHOTO_MAX_DIMENSION });
  }
  const image = await context.renderAsync();
  try {
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: REVIEW_PHOTO_QUALITY });
    return { uri: saved.uri, mimeType: "image/jpeg", fileName: `review-${index + 1}.jpg` };
  } finally {
    image.release();
    context.release();
  }
}

/** Istemci tarafi on kontrol (asil dogrulama sunucuda). Hata yoksa bos nesne. */
export function validateReview(input: { rating: number; title: string; comment: string }) {
  const errors: { rating?: string; title?: string; comment?: string } = {};
  if (!(input.rating >= 1 && input.rating <= 5)) errors.rating = "Lütfen 1-5 arası bir puan ver.";
  if (input.title.trim().length > MAX_TITLE_LENGTH) errors.title = `Başlık en fazla ${MAX_TITLE_LENGTH} karakter olabilir.`;
  const length = input.comment.trim().length;
  if (length < MIN_COMMENT_LENGTH) errors.comment = `Yorum en az ${MIN_COMMENT_LENGTH} karakter olmalı.`;
  else if (length > MAX_COMMENT_LENGTH) errors.comment = `Yorum en fazla ${MAX_COMMENT_LENGTH} karakter olabilir.`;
  return errors;
}
