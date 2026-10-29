import type {
  StoreAddressDto,
  StoreCampaignDto,
  StoreCartDto,
  StoreCategoryDto,
  StoreCheckoutOptionsDto,
  StoreOrderDto,
  StoreOrderListItemDto,
  StoreProductDetailDto,
  StoreProductListItemDto,
  StoreProductQuery,
  UpsertStoreAddressRequest,
} from "../../../services/api/store";
import { Campaign, Cart, Category, CheckoutOptions, DeliveryAddress, Order, OrderListItem, Product, ProductFilters, ProductSummary, VariantKind } from "../types";
import type { AddressInput } from "./types";

// API DTO'larini (sayisal id'ler) ekranlarin kullandigi modellere (string id'ler) cevirir. Hesap yapilmaz:
// tutarlar sunucudan geldigi gibi tasinir.

const VARIANT_KINDS: VariantKind[] = ["size", "color", "package", "option"];
const DEFAULT_TINT = "#1F2937";

export function toCategory(dto: StoreCategoryDto): Category {
  return {
    id: String(dto.id),
    name: dto.name,
    slug: dto.slug,
    image: dto.imageUrl,
    icon: dto.icon || "pricetag-outline",
    parentId: dto.parentCategoryId == null ? null : String(dto.parentCategoryId),
    productCount: dto.productCount,
  };
}

export function toProductSummary(dto: StoreProductListItemDto): ProductSummary {
  return {
    id: String(dto.id),
    name: dto.name,
    brand: dto.brand,
    categoryId: String(dto.categoryId),
    price: dto.price,
    originalPrice: dto.originalPrice,
    discountPercentage: dto.discountPercentage,
    stock: dto.stockQuantity,
    image: dto.imageUrl,
    hasVariants: dto.hasVariants,
  };
}

export function toProduct(dto: StoreProductDetailDto): Product {
  const images = dto.images.length > 0 ? dto.images : dto.imageUrl ? [dto.imageUrl] : [];
  return {
    ...toProductSummary(dto),
    image: images[0] ?? null,
    description: dto.description,
    categoryName: dto.categoryName,
    images,
    variants: dto.variants.map((g) => ({
      id: g.id,
      label: g.label,
      kind: VARIANT_KINDS.includes(g.kind as VariantKind) ? (g.kind as VariantKind) : "option",
      options: g.options.map((o) => ({ id: o.id, label: o.label, priceDelta: o.priceDelta ?? 0, inStock: o.inStock !== false, swatch: o.swatch ?? undefined })),
    })),
    features: dto.features,
    specs: dto.specs,
  };
}

export function toCampaign(dto: StoreCampaignDto): Campaign {
  return {
    id: String(dto.id),
    title: dto.title,
    description: dto.description ?? "",
    image: dto.imageUrl,
    tint: dto.tint || DEFAULT_TINT,
    discountPercentage: dto.discountPercentage,
    productCount: dto.productCount,
    featuredProduct: dto.featuredProduct ? toProductSummary(dto.featuredProduct) : null,
  };
}

export function toCart(dto: StoreCartDto): Cart {
  return {
    items: dto.items.map((i) => ({
      id: String(i.id),
      productId: String(i.productId),
      categoryId: String(i.categoryId),
      name: i.name,
      brand: i.brand,
      image: i.imageUrl,
      selectedVariant: i.selectedVariant ?? {},
      variantLabel: i.variantLabel,
      quantity: i.quantity,
      maxQuantity: i.maxQuantity,
      unitPrice: i.unitPrice,
      unitOriginalPrice: i.unitOriginalPrice,
      lineTotal: i.lineTotal,
      lineOriginalTotal: i.lineOriginalTotal,
      isAvailable: i.isAvailable,
      unavailableReason: i.unavailableReason,
    })),
    totals: {
      itemCount: dto.totals.itemCount,
      subtotal: dto.totals.subtotal,
      discount: dto.totals.discount,
      shippingCost: dto.totals.shippingCost,
      total: dto.totals.total,
      remainingForFreeShipping: dto.totals.remainingForFreeShipping,
      freeShippingThreshold: dto.totals.freeShippingThreshold,
    },
    canCheckout: dto.canCheckout,
  };
}

export function toAddress(dto: StoreAddressDto): DeliveryAddress {
  return {
    id: String(dto.id),
    title: dto.title,
    fullName: dto.recipientName,
    phone: dto.phoneNumber,
    city: dto.city,
    district: dto.district,
    address: dto.addressLine,
    isDefault: dto.isDefault,
  };
}

export function toAddressRequest(input: AddressInput): UpsertStoreAddressRequest {
  return {
    title: input.title.trim(),
    recipientName: input.fullName.trim(),
    phoneNumber: input.phone.trim(),
    city: input.city.trim(),
    district: input.district.trim(),
    addressLine: input.address.trim(),
    postalCode: null,
    isDefault: input.isDefault ?? false,
  };
}

export function toCheckoutOptions(dto: StoreCheckoutOptionsDto): CheckoutOptions {
  return {
    paymentMethods: dto.paymentMethods.map((m) => ({ ...m })),
    freeShippingThreshold: dto.freeShippingThreshold,
    shippingCost: dto.shippingCost,
  };
}

export function toOrderListItem(dto: StoreOrderListItemDto): OrderListItem {
  return {
    id: String(dto.id),
    orderNumber: dto.orderNumber,
    createdAt: dto.createdAt,
    status: dto.status,
    paymentStatus: dto.paymentStatus,
    paymentMethod: dto.paymentMethod,
    total: dto.total,
    itemCount: dto.itemCount,
    itemNames: dto.itemNames,
  };
}

export function toOrder(dto: StoreOrderDto): Order {
  const a = dto.shippingAddress;
  return {
    ...toOrderListItem(dto),
    items: dto.items.map((i) => ({
      productId: i.productId == null ? null : String(i.productId),
      name: i.name,
      brand: i.brand,
      image: i.imageUrl,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      originalUnitPrice: i.unitOriginalPrice,
      lineTotal: i.lineTotal,
      variantLabel: i.variantLabel ?? "",
    })),
    deliveryAddress: { title: a.title, fullName: a.recipientName, phone: a.phoneNumber, city: a.city, district: a.district, address: a.addressLine },
    subtotal: dto.subtotal,
    discount: dto.discount,
    shippingCost: dto.shippingCost,
    history: dto.history,
    canCancel: dto.canCancel,
    cancelReason: dto.cancelReason,
    bankTransfer: dto.bankTransfer,
  };
}

const COLLECTION_PARAM: Record<NonNullable<ProductFilters["collection"]>, StoreProductQuery["collection"]> = {
  bestsellers: "bestsellers",
  discounted: "discounted",
  featured: "featured",
  new: "new",
};

const toId = (value: string | undefined) => {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

/** Ekran filtrelerini GET /api/store/products sorgusuna cevirir. */
export function toProductQuery(filters: ProductFilters, page: number, pageSize: number): StoreProductQuery {
  const q = filters.query?.trim();
  return {
    page,
    pageSize,
    q: q ? q : undefined,
    categoryId: toId(filters.categoryId),
    campaignId: toId(filters.campaignId),
    collection: filters.collection ? COLLECTION_PARAM[filters.collection] : undefined,
    brands: filters.brands && filters.brands.length > 0 ? filters.brands.join(",") : undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    inStockOnly: filters.inStockOnly || undefined,
    discountedOnly: filters.discountedOnly || undefined,
    sort: filters.sort,
    excludeId: toId(filters.excludeId),
  };
}
