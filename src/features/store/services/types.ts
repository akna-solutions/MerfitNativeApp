import {
  Campaign,
  Cart,
  Category,
  CheckoutOptions,
  DeliveryAddress,
  Order,
  OrderListItem,
  Page,
  PaymentMethod,
  Product,
  ProductFilters,
  ProductSummary,
  Review,
  ReviewFilters,
  ReviewImage,
  ReviewInput,
  ReviewPhoto,
  ReviewReportReason,
  ReviewSummary,
  ReviewVote,
  SelectedVariant,
} from "../types";

/**
 * MB Shop servis siniri. Ekranlar, hook'lar ve StoreContext YALNIZCA bu arayuzlere baglidir; uygulamada
 * services/http.ts (MerfitCustomerApi /api/store) kullanilir, testlerde ayni arayuzun sahte bir uygulamasi verilir.
 * Fiyat, stok ve toplamlar sunucuda hesaplanir; bu arayuz hicbir yerde istemci fiyati gondermez.
 */
export interface CatalogService {
  getCategories(signal?: AbortSignal): Promise<Category[]>;
  getCampaigns(signal?: AbortSignal): Promise<Campaign[]>;
  getBrands(categoryId?: string, signal?: AbortSignal): Promise<string[]>;
  getProducts(filters: ProductFilters, page: number, pageSize: number, signal?: AbortSignal): Promise<Page<ProductSummary>>;
  /** Urun yoksa ApiError(404) firlatir. */
  getProduct(id: string, signal?: AbortSignal): Promise<Product>;
}

export interface CartService {
  get(signal?: AbortSignal): Promise<Cart>;
  /** Ayni urun + ayni varyant varsa sunucu satiri birlestirir. Stok yetmezse ApiError(409). */
  add(input: { productId: string; quantity: number; selectedVariant: SelectedVariant }): Promise<Cart>;
  /** 0 satiri kaldirir. */
  setQuantity(lineId: string, quantity: number): Promise<Cart>;
  remove(lineId: string): Promise<Cart>;
}

export interface FavoriteService {
  list(signal?: AbortSignal): Promise<ProductSummary[]>;
  add(productId: string): Promise<void>;
  remove(productId: string): Promise<void>;
}

export type AddressInput = Omit<DeliveryAddress, "id" | "isDefault"> & { isDefault?: boolean };

export interface AddressService {
  list(signal?: AbortSignal): Promise<DeliveryAddress[]>;
  create(input: AddressInput): Promise<DeliveryAddress>;
  update(id: string, input: AddressInput): Promise<DeliveryAddress>;
  remove(id: string): Promise<void>;
}

export type CreateOrderInput = {
  addressId: string;
  paymentMethod: PaymentMethod;
  /** Bu siparis denemesi icin bir kez uretilir; tekrar denemede ayni anahtar gonderilir. */
  idempotencyKey: string;
  /** Kullanicinin onayladigi genel toplam; sunucudaki tutar farkliysa siparis olusmaz. */
  expectedTotal: number;
};

export interface OrderService {
  getCheckoutOptions(signal?: AbortSignal): Promise<CheckoutOptions>;
  create(input: CreateOrderInput): Promise<Order>;
  list(page: number, pageSize: number, signal?: AbortSignal): Promise<Page<OrderListItem>>;
  /** Siparis yoksa / baskasinina aitse ApiError(404). */
  get(id: string, signal?: AbortSignal): Promise<Order>;
  cancel(id: string, reason?: string): Promise<Order>;
}

/**
 * Urun yorumlari. Onayli alisveris, ortalama/dagilim ve oy sayilari sunucuda hesaplanir. Kurallar (tek aktif yorum,
 * yalnizca sahibi duzenler/siler, kendi yorumuna oy/rapor yok) sunucuda dogrulanir; istemci yalnizca hatayi gosterir.
 */
export interface ReviewService {
  getSummary(productId: string, signal?: AbortSignal): Promise<ReviewSummary>;
  list(productId: string, filters: ReviewFilters, page: number, pageSize: number, signal?: AbortSignal): Promise<Page<Review>>;
  /** Kullanicinin bu urundeki yorumu; yoksa null. */
  getMine(productId: string, signal?: AbortSignal): Promise<Review | null>;
  /** Zaten aktif yorum varsa ApiError(409, REVIEW_EXISTS). */
  create(productId: string, input: ReviewInput): Promise<Review>;
  update(reviewId: string, input: ReviewInput): Promise<Review>;
  remove(reviewId: string): Promise<void>;
  addImage(reviewId: string, photo: ReviewPhoto): Promise<ReviewImage>;
  removeImage(reviewId: string, imageId: string): Promise<void>;
  /** null oyu kaldirir. */
  vote(reviewId: string, isHelpful: boolean | null): Promise<ReviewVote>;
  report(reviewId: string, reason: ReviewReportReason, description: string | null): Promise<{ alreadyReported: boolean }>;
}

export type StoreServices = {
  catalog: CatalogService;
  cart: CartService;
  favorites: FavoriteService;
  addresses: AddressService;
  orders: OrderService;
  reviews: ReviewService;
};
