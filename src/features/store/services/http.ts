import * as storeApi from "../../../services/api/store";
import { ApiError } from "../../../services/api/client";
import { toAddress, toAddressRequest, toCampaign, toCart, toCategory, toCheckoutOptions, toOrder, toOrderListItem, toProduct, toProductQuery, toProductSummary } from "./mappers";
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
  };
}
