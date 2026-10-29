import {
  CartItem,
  Campaign,
  Category,
  DeliveryAddress,
  Order,
  PaymentMethod,
  Product,
  ProductFilters,
  SelectedVariant,
} from "../types";

/**
 * Store servis siniri. Ekranlar ve hook'lar YALNIZCA bu arayuzlere baglidir (bkz. ../README.md);
 * .NET Web API'ye gecerken sadece bu arayuzlerin HTTP implementasyonu yazilip services/index.ts'te
 * degistirilir. Tum cagrilar Promise doner, boylece ag gecikmesi/hata yonetimi ekranlarda hazirdir.
 */
export interface CatalogService {
  getCategories(): Promise<Category[]>;
  getCampaigns(): Promise<Campaign[]>;
  getProducts(filters?: ProductFilters): Promise<Product[]>;
  /** Urun yoksa null doner. */
  getProduct(id: string): Promise<Product | null>;
}

export interface CartService {
  getItems(): Promise<CartItem[]>;
  /** Ayni urun + ayni varyant varsa satiri birlestirir (adedi artirir). */
  addItem(input: { productId: string; quantity: number; selectedVariant: SelectedVariant }): Promise<CartItem[]>;
  setQuantity(productId: string, selectedVariant: SelectedVariant, quantity: number): Promise<CartItem[]>;
  removeItem(productId: string, selectedVariant: SelectedVariant): Promise<CartItem[]>;
  clear(): Promise<CartItem[]>;
}

export interface FavoriteService {
  getFavoriteIds(): Promise<string[]>;
  /** Donus: guncel favori id listesi. */
  toggle(productId: string): Promise<string[]>;
}

export type CreateOrderInput = {
  items: CartItem[];
  deliveryAddress: DeliveryAddress;
  paymentMethod: PaymentMethod;
};

export interface OrderService {
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  /** Backend'de fiyat/stok dogrulamasi sunucuda yapilir; dummy implementasyon yerelde hesaplar. */
  createOrder(input: CreateOrderInput): Promise<Order>;
}

export interface AddressService {
  getAddresses(): Promise<DeliveryAddress[]>;
  /** id verilmezse yeni adres olusturur. */
  saveAddress(address: Omit<DeliveryAddress, "id"> & { id?: string }): Promise<DeliveryAddress[]>;
  removeAddress(id: string): Promise<DeliveryAddress[]>;
}

export type StoreServices = {
  catalog: CatalogService;
  cart: CartService;
  favorites: FavoriteService;
  orders: OrderService;
  addresses: AddressService;
};
