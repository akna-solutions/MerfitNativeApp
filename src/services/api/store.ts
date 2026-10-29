import { apiRequest } from "./client";

// MB Shop uc noktalari (MerfitCustomerApi, /api/store). Tum uclar oturum ister; kullanici kimligi JWT'den okunur.
// Fiyat, indirim, kargo ve toplamlar her zaman sunucuda hesaplanir; istemci yalnizca gosterir.

export type StorePagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type StoreCategoryDto = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  icon: string | null;
  parentCategoryId: number | null;
  productCount: number;
};

export type StoreProductListItemDto = {
  id: number;
  name: string;
  slug: string;
  brand: string;
  sku: string;
  categoryId: number;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  stockQuantity: number;
  inStock: boolean;
  imageUrl: string | null;
  hasVariants: boolean;
  isFeatured: boolean;
  createdAt: string;
};

export type StoreVariantOptionDto = { id: string; label: string; priceDelta?: number; inStock?: boolean; swatch?: string | null };
export type StoreVariantGroupDto = { id: string; label: string; kind: string; options: StoreVariantOptionDto[] };

export type StoreProductDetailDto = StoreProductListItemDto & {
  description: string;
  categoryName: string | null;
  images: string[];
  variants: StoreVariantGroupDto[];
  features: string[];
  specs: { label: string; value: string }[];
};

export type StoreCampaignDto = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  tint: string | null;
  discountPercentage: number;
  productCount: number;
  featuredProduct: StoreProductListItemDto | null;
};

export type StoreProductQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  categoryId?: number;
  campaignId?: number;
  collection?: "featured" | "discounted" | "new" | "bestsellers";
  /** Virgulle ayrilmis marka listesi. */
  brands?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  discountedOnly?: boolean;
  sort?: string;
  excludeId?: number;
};

export type StoreTotalsDto = {
  itemCount: number;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  remainingForFreeShipping: number;
  freeShippingThreshold: number;
  currency: string;
};

export type StoreCartItemDto = {
  id: number;
  productId: number;
  categoryId: number;
  name: string;
  brand: string;
  sku: string;
  imageUrl: string | null;
  selectedVariant: Record<string, string>;
  variantLabel: string;
  quantity: number;
  maxQuantity: number;
  unitPrice: number;
  unitOriginalPrice: number;
  lineTotal: number;
  lineOriginalTotal: number;
  isAvailable: boolean;
  unavailableReason: string | null;
};

export type StoreCartDto = { items: StoreCartItemDto[]; totals: StoreTotalsDto; canCheckout: boolean };

export type StoreAddressDto = {
  id: number;
  title: string;
  recipientName: string;
  phoneNumber: string;
  city: string;
  district: string;
  addressLine: string;
  postalCode: string | null;
  isDefault: boolean;
};

export type UpsertStoreAddressRequest = Omit<StoreAddressDto, "id">;

export type StorePaymentMethodCode = "cash_on_delivery" | "bank_transfer" | "card";

export type StoreCheckoutOptionsDto = {
  paymentMethods: { method: StorePaymentMethodCode; label: string; description: string; available: boolean; unavailableReason: string | null }[];
  freeShippingThreshold: number;
  shippingCost: number;
  maxQuantityPerLine: number;
  currency: string;
};

export type CreateStoreOrderRequest = {
  addressId: number;
  paymentMethod: StorePaymentMethodCode;
  /** Bu siparis denemesi icin bir kez uretilir; ag hatasinda ayni anahtarla tekrar gonderilir (cift siparis olmaz). */
  idempotencyKey: string;
  /** Kullanicinin onayladigi tutar; sunucudaki tutardan farkliysa 409 PRICE_CHANGED. */
  expectedTotal?: number;
};

export type StoreOrderListItemDto = {
  id: number;
  orderNumber: string;
  createdAt: string;
  status: "received" | "preparing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refund_pending" | "refunded" | "cancelled";
  paymentMethod: StorePaymentMethodCode;
  total: number;
  currency: string;
  itemCount: number;
  itemNames: string[];
};

export type StoreOrderDto = StoreOrderListItemDto & {
  subtotal: number;
  discount: number;
  shippingCost: number;
  shippingAddress: Omit<StoreAddressDto, "id" | "isDefault">;
  items: {
    productId: number | null;
    name: string;
    brand: string;
    sku: string;
    imageUrl: string | null;
    variantLabel: string | null;
    quantity: number;
    unitPrice: number;
    unitOriginalPrice: number;
    discountAmount: number;
    lineTotal: number;
  }[];
  history: { status: StoreOrderListItemDto["status"]; paymentStatus: StoreOrderListItemDto["paymentStatus"]; note: string | null; createdAt: string }[];
  canCancel: boolean;
  cancelledAt: string | null;
  cancelReason: string | null;
  bankTransfer: { iban: string; accountName: string; bankName: string | null; reference: string } | null;
};

/** Siparis olusturulurken sunucunun dondurdugu 409 kodlari (ApiError.fieldErrors icinde). */
export const STORE_ORDER_CONFLICT_CODES = ["PRICE_CHANGED", "CART_CHANGED", "OUT_OF_STOCK"] as const;

export function getCategories(signal?: AbortSignal) {
  return apiRequest<StoreCategoryDto[]>("/api/store/categories", { signal });
}

export function getCampaigns(signal?: AbortSignal) {
  return apiRequest<StoreCampaignDto[]>("/api/store/campaigns", { signal });
}

export function getBrands(categoryId?: number, signal?: AbortSignal) {
  return apiRequest<string[]>("/api/store/brands", { query: { categoryId }, signal });
}

export function getProducts(query: StoreProductQuery, signal?: AbortSignal) {
  return apiRequest<StorePagedResponse<StoreProductListItemDto>>("/api/store/products", { query, signal });
}

/** Urun yoksa veya satistan kalkmissa 404. */
export function getProduct(id: number, signal?: AbortSignal) {
  return apiRequest<StoreProductDetailDto>(`/api/store/products/${id}`, { signal });
}

export function getCart(signal?: AbortSignal) {
  return apiRequest<StoreCartDto>("/api/store/cart", { signal });
}

/** Fiyat gonderilmez; sunucu guncel fiyat, varyant ve stogu dogrular (stok yetmezse 409). */
export function addCartItem(body: { productId: number; quantity: number; selectedVariant?: Record<string, string> }) {
  return apiRequest<StoreCartDto>("/api/store/cart/items", { method: "POST", body });
}

/** 0 satiri kaldirir. */
export function updateCartItem(itemId: number, quantity: number) {
  return apiRequest<StoreCartDto>(`/api/store/cart/items/${itemId}`, { method: "PATCH", body: { quantity } });
}

export function removeCartItem(itemId: number) {
  return apiRequest<StoreCartDto>(`/api/store/cart/items/${itemId}`, { method: "DELETE" });
}

export function clearCart() {
  return apiRequest<StoreCartDto>("/api/store/cart", { method: "DELETE" });
}

export function getFavorites(signal?: AbortSignal) {
  return apiRequest<StoreProductListItemDto[]>("/api/store/favorites", { signal });
}

/** Idempotent: zaten favorideyse de 204. */
export function addFavorite(productId: number) {
  return apiRequest<void>(`/api/store/favorites/${productId}`, { method: "PUT" });
}

export function removeFavorite(productId: number) {
  return apiRequest<void>(`/api/store/favorites/${productId}`, { method: "DELETE" });
}

export function getAddresses(signal?: AbortSignal) {
  return apiRequest<StoreAddressDto[]>("/api/store/addresses", { signal });
}

export function createAddress(body: UpsertStoreAddressRequest) {
  return apiRequest<StoreAddressDto>("/api/store/addresses", { method: "POST", body });
}

export function updateAddress(id: number, body: UpsertStoreAddressRequest) {
  return apiRequest<StoreAddressDto>(`/api/store/addresses/${id}`, { method: "PUT", body });
}

export function deleteAddress(id: number) {
  return apiRequest<void>(`/api/store/addresses/${id}`, { method: "DELETE" });
}

export function getCheckoutOptions(signal?: AbortSignal) {
  return apiRequest<StoreCheckoutOptionsDto>("/api/store/checkout/options", { signal });
}

/** 201: yeni siparis, 200: ayni idempotencyKey ile daha once olusturulmus siparis. */
export function createOrder(body: CreateStoreOrderRequest) {
  return apiRequest<StoreOrderDto>("/api/store/orders", { method: "POST", body });
}

export function getOrders(page: number, pageSize: number, signal?: AbortSignal) {
  return apiRequest<StorePagedResponse<StoreOrderListItemDto>>("/api/store/orders", { query: { page, pageSize }, signal });
}

export function getOrder(id: number, signal?: AbortSignal) {
  return apiRequest<StoreOrderDto>(`/api/store/orders/${id}`, { signal });
}

/** Yalnizca "received" durumundaki siparis iptal edilebilir; aksi halde 409. */
export function cancelOrder(id: number, reason?: string) {
  return apiRequest<StoreOrderDto>(`/api/store/orders/${id}/cancel`, { method: "POST", body: { reason } });
}
