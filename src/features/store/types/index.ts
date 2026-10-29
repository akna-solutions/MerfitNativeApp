/**
 * Store (e-ticaret) modulunun alan modelleri. Tamami simdilik dummy veriyle calisir; ileride .NET Web API
 * DTO'lari bu tiplere map'lenir (bkz. ../README.md).
 */

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  /** Gorsel yuklenemediginde gosterilen Ionicons adi. */
  icon: string;
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

export type Product = {
  id: string;
  name: string;
  brand: string;
  description: string;
  images: string[];
  categoryId: string;
  /** Guncel birim fiyat (TL). */
  price: number;
  /** Indirim oncesi fiyat; indirim yoksa price ile aynidir. */
  originalPrice: number;
  /** price ve originalPrice'tan turetilir (bkz. utils/pricing.ts); elle yazilmaz. */
  discountPercentage: number;
  stock: number;
  variants: VariantGroup[];
  rating: number;
  reviewCount: number;
  tags: string[];
  features: string[];
  /** Kullanim bilgileri veya teknik ozellikler. */
  specs: { label: string; value: string }[];
};

export type Campaign = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  productIds: string[];
  /** Kampanyadaki urunlerin en yuksek indirim orani; urun verisinden turetilir. */
  discountPercentage: number;
  /** Kart zemin rengi (kampanya karti gorseli yokken de dolu gorunur). */
  tint: string;
};

/** groupId -> optionId */
export type SelectedVariant = Record<string, string>;

export type CartItem = {
  productId: string;
  quantity: number;
  selectedVariant: SelectedVariant;
  /** Sepete eklendigi andaki, varyant farki dahil birim fiyat. */
  unitPrice: number;
};

export type DeliveryAddress = {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
};

export type OrderStatus = "received" | "preparing" | "shipped" | "delivered";

export type OrderItem = {
  productId: string;
  name: string;
  brand: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  originalUnitPrice: number;
  variantLabel: string;
};

export type PaymentMethod = "cash_on_delivery" | "bank_transfer" | "card_simulation";

export type Order = {
  id: string;
  createdAt: string;
  items: OrderItem[];
  deliveryAddress: DeliveryAddress;
  /** Liste (indirimsiz) fiyatlarla urun toplami. */
  subtotal: number;
  discount: number;
  shippingCost: number;
  /** subtotal - discount + shippingCost */
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  estimatedDelivery: string;
};

export type CartTotals = {
  itemCount: number;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  /** Ucretsiz kargoya kalan tutar; zaten ucretsizse 0. */
  remainingForFreeShipping: number;
};

export type SortKey = "featured" | "price_asc" | "price_desc" | "discount" | "rating" | "newest";

export type ProductFilters = {
  query?: string;
  categoryId?: string;
  collection?: CollectionKey;
  inStockOnly?: boolean;
  discountedOnly?: boolean;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: SortKey;
};

export type CollectionKey = "bestsellers" | "discounted" | "forYou" | "new";
