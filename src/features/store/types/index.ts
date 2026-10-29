/**
 * MB Shop alan modelleri. Veriler MerfitCustomerApi'nin /api/store uc noktalarindan gelir ve services/mappers.ts'te
 * bu tiplere cevrilir. Fiyatlar, indirimler, kargo ve toplamlar sunucuda hesaplanir; ekranlar yalnizca gosterir.
 */

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  /** Gorsel yoksa gosterilen Ionicons adi (admin panelinden girilir). */
  icon: string;
  parentId: string | null;
  /** Kategorideki satistaki urun sayisi. */
  productCount: number;
};

export type VariantKind = "size" | "color" | "package" | "option";

export type VariantOption = {
  id: string;
  label: string;
  /** Secenegin birim fiyata (hem guncel hem eski fiyata) ekledigi tutar, TL. */
  priceDelta?: number;
  /** false ise secenek stokta yoktur ve secilemez. */
  inStock?: boolean;
  /** kind === "color" icin gosterilen renk. */
  swatch?: string;
};

export type VariantGroup = {
  id: string;
  label: string;
  kind: VariantKind;
  options: VariantOption[];
};

/** Liste ve kartlarda gosterilen urun ozeti. */
export type ProductSummary = {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  /** Guncel satis fiyati (TL). */
  price: number;
  /** Indirim oncesi fiyat; indirim yoksa price ile aynidir. */
  originalPrice: number;
  /** Sunucunun hesapladigi indirim orani. */
  discountPercentage: number;
  stock: number;
  image: string | null;
  /** true ise sepete eklemeden once secenek secilmelidir. */
  hasVariants: boolean;
};

/** Urun detay ekrani. */
export type Product = ProductSummary & {
  description: string;
  categoryName: string | null;
  images: string[];
  variants: VariantGroup[];
  features: string[];
  /** Kullanim bilgileri veya teknik ozellikler. */
  specs: { label: string; value: string }[];
};

export type Campaign = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  /** Kampanyadaki urunlerin en yuksek indirim orani (sunucuda hesaplanir). */
  discountPercentage: number;
  productCount: number;
  /** Kartta fiyati gosterilen urun. */
  featuredProduct: ProductSummary | null;
  /** Kart zemin rengi. */
  tint: string;
};

/** groupId -> optionId */
export type SelectedVariant = Record<string, string>;

export type CartTotals = {
  itemCount: number;
  /** Liste (indirimsiz) fiyatlarla ara toplam. */
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  /** Ucretsiz kargoya kalan tutar; zaten ucretsizse 0. */
  remainingForFreeShipping: number;
  freeShippingThreshold: number;
};

export type CartLine = {
  /** Sepet satiri kimligi (adet guncelleme/silme). */
  id: string;
  productId: string;
  categoryId: string;
  name: string;
  brand: string;
  image: string | null;
  selectedVariant: SelectedVariant;
  variantLabel: string;
  quantity: number;
  /** Stok ve satir siniriyla secilebilecek en fazla adet. */
  maxQuantity: number;
  unitPrice: number;
  unitOriginalPrice: number;
  lineTotal: number;
  lineOriginalTotal: number;
  /** false ise urun satistan kalkmis / stok yetmiyor; toplamlara katilmaz ve siparis verilemez. */
  isAvailable: boolean;
  unavailableReason: string | null;
};

export type Cart = {
  items: CartLine[];
  totals: CartTotals;
  canCheckout: boolean;
};

export type DeliveryAddress = {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  isDefault: boolean;
};

export type OrderStatus = "received" | "preparing" | "shipped" | "delivered" | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refund_pending" | "refunded" | "cancelled";

export type PaymentMethod = "cash_on_delivery" | "bank_transfer" | "card";

export type OrderItem = {
  productId: string | null;
  name: string;
  brand: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  originalUnitPrice: number;
  lineTotal: number;
  variantLabel: string;
};

export type OrderListItem = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  total: number;
  itemCount: number;
  itemNames: string[];
};

export type Order = OrderListItem & {
  items: OrderItem[];
  deliveryAddress: Omit<DeliveryAddress, "id" | "isDefault">;
  /** Liste (indirimsiz) fiyatlarla urun toplami. */
  subtotal: number;
  discount: number;
  shippingCost: number;
  history: { status: OrderStatus; paymentStatus: PaymentStatus; note: string | null; createdAt: string }[];
  canCancel: boolean;
  cancelReason: string | null;
  /** Havale ile odenecek ve odeme bekleyen sipariste banka bilgisi. */
  bankTransfer: { iban: string; accountName: string; bankName: string | null; reference: string } | null;
};

export type PaymentOption = {
  method: PaymentMethod;
  label: string;
  description: string;
  available: boolean;
  unavailableReason: string | null;
};

export type CheckoutOptions = {
  paymentMethods: PaymentOption[];
  freeShippingThreshold: number;
  shippingCost: number;
};

export type SortKey = "featured" | "price_asc" | "price_desc" | "discount" | "newest" | "name_asc" | "bestsellers";

export type CollectionKey = "bestsellers" | "discounted" | "featured" | "new";

export type ProductFilters = {
  query?: string;
  categoryId?: string;
  campaignId?: string;
  collection?: CollectionKey;
  inStockOnly?: boolean;
  discountedOnly?: boolean;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: SortKey;
  excludeId?: string;
};

export type Page<T> = { items: T[]; page: number; totalCount: number; hasNextPage: boolean };
