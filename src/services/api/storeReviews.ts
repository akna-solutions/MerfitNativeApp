import { File } from "expo-file-system";
import { Platform } from "react-native";

import { apiRequest } from "./client";
import { StorePagedResponse } from "./store";

// MB Shop urun yorumlari (MerfitCustomerApi, /api/store). Kullanici kimligi JWT'den okunur; onayli alisveris rozeti,
// puan ortalamasi, dagilim ve faydali oy sayilari sunucuda hesaplanir. Istemci yalnizca gosterir.

export type StoreReviewSort = "newest" | "oldest" | "rating_desc" | "rating_asc" | "helpful";

export type StoreReviewSummaryDto = {
  productId: number;
  averageRating: number;
  reviewCount: number;
  /** 5'ten 1'e siralidir. */
  distribution: { rating: number; count: number; percentage: number }[];
  withPhotosCount: number;
  verifiedPurchaseCount: number;
  /** Kullanicinin bu urundeki aktif yorumu (yayinda ya da gizlenmis). */
  myReviewId: number | null;
  /** Kullanici urunu teslim alinmis bir sipariste satin aldi mi (yeni yorumda rozet icin). */
  hasVerifiedPurchase: boolean;
};

export type StoreReviewImageDto = { id: number; url: string; width: number; height: number };

export type StoreReviewDto = {
  id: number;
  productId: number;
  rating: number;
  title: string | null;
  comment: string;
  isVerifiedPurchase: boolean;
  /** "published"; kullanicinin kendi yorumu yonetici tarafindan gizlendiyse "hidden". */
  status: "published" | "hidden";
  createdAt: string;
  editedAt: string | null;
  author: { displayName: string; avatarUrl: string | null };
  images: StoreReviewImageDto[];
  helpfulCount: number;
  notHelpfulCount: number;
  myVote: boolean | null;
  isMine: boolean;
  reportedByMe: boolean;
};

export type StoreReviewQuery = {
  page: number;
  pageSize: number;
  sort?: StoreReviewSort;
  rating?: number;
  withPhotos?: boolean;
  verifiedOnly?: boolean;
};

export type UpsertStoreReviewRequest = { rating: number; title: string | null; comment: string };
export type StoreReviewVoteResponse = { reviewId: number; helpfulCount: number; notHelpfulCount: number; myVote: boolean | null };
export type StoreReviewReportReason = "Spam" | "Offensive" | "Misleading" | "Irrelevant" | "Other";

/** Cihazda hazirlanmis (kucultulmus, JPEG) yorum fotografi. */
export type ReviewPhotoUpload = { uri: string; mimeType: "image/jpeg"; fileName: string };

export function getReviewSummary(productId: number, signal?: AbortSignal) {
  return apiRequest<StoreReviewSummaryDto>(`/api/store/products/${productId}/reviews/summary`, { signal });
}

export function getReviews(productId: number, query: StoreReviewQuery, signal?: AbortSignal) {
  return apiRequest<StorePagedResponse<StoreReviewDto>>(`/api/store/products/${productId}/reviews`, {
    query: {
      page: query.page,
      pageSize: query.pageSize,
      sort: query.sort,
      rating: query.rating,
      withPhotos: query.withPhotos || undefined,
      verifiedOnly: query.verifiedOnly || undefined,
    },
    signal,
  });
}

/** Kullanicinin bu urundeki yorumu; yoksa undefined (204). */
export function getMyReview(productId: number, signal?: AbortSignal) {
  return apiRequest<StoreReviewDto | undefined>(`/api/store/products/${productId}/reviews/mine`, { signal });
}

export function createReview(productId: number, body: UpsertStoreReviewRequest) {
  return apiRequest<StoreReviewDto>(`/api/store/products/${productId}/reviews`, { method: "POST", body });
}

export function updateReview(reviewId: number, body: UpsertStoreReviewRequest) {
  return apiRequest<StoreReviewDto>(`/api/store/reviews/${reviewId}`, { method: "PUT", body });
}

export function deleteReview(reviewId: number) {
  return apiRequest<void>(`/api/store/reviews/${reviewId}`, { method: "DELETE" });
}

async function toFormData(photo: ReviewPhotoUpload): Promise<FormData> {
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(photo.uri)).blob();
    form.append("photo", blob, photo.fileName);
  } else {
    // Bkz. foodAnalysis.ts: expo/fetch { uri, name, type } parcasini desteklemez; expo-file-system File Blob gibi davranir.
    form.append("photo", new File(photo.uri), photo.fileName);
  }
  return form;
}

export async function uploadReviewImage(reviewId: number, photo: ReviewPhotoUpload) {
  return apiRequest<StoreReviewImageDto>(`/api/store/reviews/${reviewId}/images`, {
    method: "POST",
    body: await toFormData(photo),
    timeoutMs: 45_000,
  });
}

export function deleteReviewImage(reviewId: number, imageId: number) {
  return apiRequest<void>(`/api/store/reviews/${reviewId}/images/${imageId}`, { method: "DELETE" });
}

export function voteReview(reviewId: number, isHelpful: boolean) {
  return apiRequest<StoreReviewVoteResponse>(`/api/store/reviews/${reviewId}/vote`, { method: "PUT", body: { isHelpful } });
}

export function removeReviewVote(reviewId: number) {
  return apiRequest<StoreReviewVoteResponse>(`/api/store/reviews/${reviewId}/vote`, { method: "DELETE" });
}

export function reportReview(reviewId: number, reason: StoreReviewReportReason, description: string | null) {
  return apiRequest<{ alreadyReported: boolean }>(`/api/store/reviews/${reviewId}/reports`, {
    method: "POST",
    body: { reason, description },
  });
}
