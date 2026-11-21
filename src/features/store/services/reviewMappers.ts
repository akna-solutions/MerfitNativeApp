import { API_BASE_URL } from "../../../services/api/config";
import type { StoreReviewDto, StoreReviewImageDto, StoreReviewQuery, StoreReviewSummaryDto, StoreReviewVoteResponse } from "../../../services/api/storeReviews";
import { Review, ReviewFilters, ReviewImage, ReviewSummary, ReviewVote } from "../types";

/** Sunucu yorum fotograflarini goreli yol olarak doner (/api/store/review-images/{anahtar}). */
export function absoluteReviewImageUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function toReviewImage(dto: StoreReviewImageDto): ReviewImage {
  return { id: String(dto.id), url: absoluteReviewImageUrl(dto.url), width: dto.width, height: dto.height };
}

export function toReviewSummary(dto: StoreReviewSummaryDto): ReviewSummary {
  return {
    productId: String(dto.productId),
    averageRating: dto.averageRating,
    reviewCount: dto.reviewCount,
    distribution: [5, 4, 3, 2, 1].map((rating) => {
      const row = dto.distribution.find((d) => d.rating === rating);
      return { rating, count: row?.count ?? 0, percentage: row?.percentage ?? 0 };
    }),
    withPhotosCount: dto.withPhotosCount,
    verifiedPurchaseCount: dto.verifiedPurchaseCount,
    myReviewId: dto.myReviewId == null ? null : String(dto.myReviewId),
    hasVerifiedPurchase: dto.hasVerifiedPurchase,
  };
}

export function toReview(dto: StoreReviewDto): Review {
  return {
    id: String(dto.id),
    productId: String(dto.productId),
    rating: dto.rating,
    title: dto.title,
    comment: dto.comment,
    isVerifiedPurchase: dto.isVerifiedPurchase,
    status: dto.status,
    createdAt: dto.createdAt,
    editedAt: dto.editedAt,
    authorName: dto.author.displayName,
    authorAvatar: dto.author.avatarUrl,
    images: dto.images.map(toReviewImage),
    helpfulCount: dto.helpfulCount,
    notHelpfulCount: dto.notHelpfulCount,
    myVote: dto.myVote,
    isMine: dto.isMine,
    reportedByMe: dto.reportedByMe,
  };
}

export function toReviewVote(dto: StoreReviewVoteResponse): ReviewVote {
  return { reviewId: String(dto.reviewId), helpfulCount: dto.helpfulCount, notHelpfulCount: dto.notHelpfulCount, myVote: dto.myVote };
}

export function toReviewQuery(filters: ReviewFilters, page: number, pageSize: number): StoreReviewQuery {
  return { page, pageSize, sort: filters.sort, rating: filters.rating, withPhotos: filters.withPhotos, verifiedOnly: filters.verifiedOnly };
}
