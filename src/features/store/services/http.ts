import * as storeApi from "../../../services/api/store";
import * as reviewApi from "../../../services/api/storeReviews";
import { ApiError } from "../../../services/api/client";
import { toAddress, toAddressRequest, toCampaign, toCart, toCategory, toCheckoutOptions, toOrder, toOrderListItem, toProduct, toProductQuery, toProductSummary } from "./mappers";
import { toReview, toReviewImage, toReviewQuery, toReviewSummary, toReviewVote } from "./reviewMappers";
import { StoreServices } from "./types";

/** Sayisal olmayan bir id (bozuk derin baglanti vb.) sunucuya gitmeden 404 gibi ele alinir. */
function numericId(id: string, what: string): number {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError(404, `${what} bulunamadı.`);
  return n;
}

/** MerfitCustomerApi /api/store uc noktalarini kullanan servisler. */
export function createHttpStoreServices(): StoreServices {
  return {
    catalog: {
      getCategories: async (signal) => (await storeApi.getCategories(signal)).map(toCategory),
      getCampaigns: async (signal) => (await storeApi.getCampaigns(signal)).map(toCampaign),
      getBrands: (categoryId, signal) => storeApi.getBrands(categoryId ? Number(categoryId) : undefined, signal),
      getProducts: async (filters, page, pageSize, signal) => {
        const result = await storeApi.getProducts(toProductQuery(filters, page, pageSize), signal);
        return { items: result.items.map(toProductSummary), page: result.page, totalCount: result.totalCount, hasNextPage: result.hasNextPage };
      },
      getProduct: async (id, signal) => toProduct(await storeApi.getProduct(numericId(id, "Ürün"), signal)),
      getRecommendations: async (id, signal) => {
        const dto = await storeApi.getProductRecommendations(numericId(id, "Ürün"), undefined, signal);
        return { similar: dto.similar.map(toProductSummary), recommended: dto.recommended.map(toProductSummary), personalized: dto.personalized };
      },
    },
    cart: {
      get: async (signal) => toCart(await storeApi.getCart(signal)),
      add: async ({ productId, quantity, selectedVariant }) =>
        toCart(await storeApi.addCartItem({ productId: numericId(productId, "Ürün"), quantity, selectedVariant })),
      setQuantity: async (lineId, quantity) => toCart(await storeApi.updateCartItem(numericId(lineId, "Sepet satırı"), quantity)),
      remove: async (lineId) => toCart(await storeApi.removeCartItem(numericId(lineId, "Sepet satırı"))),
    },
    favorites: {
      list: async (signal) => (await storeApi.getFavorites(signal)).map(toProductSummary),
      add: (productId) => storeApi.addFavorite(numericId(productId, "Ürün")),
      remove: (productId) => storeApi.removeFavorite(numericId(productId, "Ürün")),
    },
    addresses: {
      list: async (signal) => (await storeApi.getAddresses(signal)).map(toAddress),
      create: async (input) => toAddress(await storeApi.createAddress(toAddressRequest(input))),
      update: async (id, input) => toAddress(await storeApi.updateAddress(numericId(id, "Adres"), toAddressRequest(input))),
      remove: (id) => storeApi.deleteAddress(numericId(id, "Adres")),
    },
    orders: {
      getCheckoutOptions: async (signal) => toCheckoutOptions(await storeApi.getCheckoutOptions(signal)),
      create: async (input) =>
        toOrder(
          await storeApi.createOrder({
            addressId: numericId(input.addressId, "Adres"),
            paymentMethod: input.paymentMethod,
            idempotencyKey: input.idempotencyKey,
            expectedTotal: input.expectedTotal,
          }),
        ),
      list: async (page, pageSize, signal) => {
        const result = await storeApi.getOrders(page, pageSize, signal);
        return { items: result.items.map(toOrderListItem), page: result.page, totalCount: result.totalCount, hasNextPage: result.hasNextPage };
      },
      get: async (id, signal) => toOrder(await storeApi.getOrder(numericId(id, "Sipariş"), signal)),
      cancel: async (id, reason) => toOrder(await storeApi.cancelOrder(numericId(id, "Sipariş"), reason)),
    },
    reviews: {
      getSummary: async (productId, signal) => toReviewSummary(await reviewApi.getReviewSummary(numericId(productId, "Ürün"), signal)),
      list: async (productId, filters, page, pageSize, signal) => {
        const result = await reviewApi.getReviews(numericId(productId, "Ürün"), toReviewQuery(filters, page, pageSize), signal);
        return { items: result.items.map(toReview), page: result.page, totalCount: result.totalCount, hasNextPage: result.hasNextPage };
      },
      getMine: async (productId, signal) => {
        const dto = await reviewApi.getMyReview(numericId(productId, "Ürün"), signal);
        return dto ? toReview(dto) : null;
      },
      create: async (productId, input) => toReview(await reviewApi.createReview(numericId(productId, "Ürün"), input)),
      update: async (reviewId, input) => toReview(await reviewApi.updateReview(numericId(reviewId, "Yorum"), input)),
      remove: async (reviewId) => reviewApi.deleteReview(numericId(reviewId, "Yorum")),
      addImage: async (reviewId, photo) => toReviewImage(await reviewApi.uploadReviewImage(numericId(reviewId, "Yorum"), photo)),
      removeImage: async (reviewId, imageId) => reviewApi.deleteReviewImage(numericId(reviewId, "Yorum"), numericId(imageId, "Fotoğraf")),
      vote: async (reviewId, isHelpful) => {
        const id = numericId(reviewId, "Yorum");
        return toReviewVote(isHelpful === null ? await reviewApi.removeReviewVote(id) : await reviewApi.voteReview(id, isHelpful));
      },
      report: async (reviewId, reason, description) => reviewApi.reportReview(numericId(reviewId, "Yorum"), reason, description),
    },
  };
}
