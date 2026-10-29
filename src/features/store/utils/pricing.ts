import { CartItem, CartTotals, Product, SelectedVariant } from "../types";

/** Bu tutarin (indirimli ara toplam) ustundeki siparislerde kargo ucretsizdir (dummy kural). */
export const FREE_SHIPPING_THRESHOLD = 500;
/** Ucretsiz kargo esiginin altindaki siparislerin sabit kargo bedeli (dummy kural). */
export const SHIPPING_FEE = 49.9;
/** Bir urunden tek seferde sepete eklenebilecek en fazla adet. */
export const MAX_QUANTITY_PER_ITEM = 10;

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Eski ve guncel fiyattan indirim yuzdesi; indirim yoksa 0. */
export function discountPercent(originalPrice: number, price: number): number {
  if (originalPrice <= 0 || price >= originalPrice) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

const priceFormatter = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatPrice(value: number): string {
  return `${priceFormatter.format(round2(value))} ₺`;
}

function variantDelta(product: Product, selected: SelectedVariant): number {
  let delta = 0;
  for (const group of product.variants) {
    const option = group.options.find((o) => o.id === selected[group.id]);
    delta += option?.priceDelta ?? 0;
  }
  return delta;
}

/** Secilen varyantlar dahil guncel birim fiyat. */
export function unitPriceFor(product: Product, selected: SelectedVariant): number {
  return round2(product.price + variantDelta(product, selected));
}

/** Secilen varyantlar dahil indirim oncesi birim fiyat. */
export function originalUnitPriceFor(product: Product, selected: SelectedVariant): number {
  return round2(product.originalPrice + variantDelta(product, selected));
}

/** Varyant gerektiren her grup icin gecerli (stokta) bir secim yapildi mi. */
export function isVariantSelectionComplete(product: Product, selected: SelectedVariant): boolean {
  return product.variants.every((group) => {
    const option = group.options.find((o) => o.id === selected[group.id]);
    return option !== undefined && option.inStock !== false;
  });
}

export function variantLabel(product: Product, selected: SelectedVariant): string {
  return product.variants
    .map((group) => group.options.find((o) => o.id === selected[group.id])?.label)
    .filter((label): label is string => Boolean(label))
    .join(" · ");
}

export function variantKey(selected: SelectedVariant): string {
  return Object.keys(selected)
    .sort()
    .map((k) => `${k}:${selected[k]}`)
    .join("|");
}

export function maxQuantityFor(product: Product): number {
  return Math.max(0, Math.min(product.stock, MAX_QUANTITY_PER_ITEM));
}

export function clampQuantity(quantity: number, product: Product): number {
  if (!Number.isFinite(quantity)) return 1;
  const max = maxQuantityFor(product);
  return Math.max(max === 0 ? 0 : 1, Math.min(Math.floor(quantity), max));
}

export function shippingFor(discountedSubtotal: number): number {
  if (discountedSubtotal <= 0 || discountedSubtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_FEE;
}

/**
 * Sepet ve siparis toplamlarinin TEK hesap noktasi: ekranlar bu fonksiyonu kullanir.
 *   subtotal = liste fiyatiyla urun toplami, discount = liste - guncel fiyat farki,
 *   total = subtotal - discount + shippingCost
 */
export function calculateTotals(items: CartItem[], productsById: ReadonlyMap<string, Product>): CartTotals {
  let itemCount = 0;
  let subtotal = 0;
  let paid = 0;
  for (const item of items) {
    const product = productsById.get(item.productId);
    if (!product) continue;
    itemCount += item.quantity;
    subtotal += originalUnitPriceFor(product, item.selectedVariant) * item.quantity;
    paid += item.unitPrice * item.quantity;
  }
  subtotal = round2(subtotal);
  paid = round2(paid);
  const discount = round2(Math.max(0, subtotal - paid));
  const shippingCost = shippingFor(paid);
  return {
    itemCount,
    subtotal,
    discount,
    shippingCost,
    total: round2(paid + shippingCost),
    remainingForFreeShipping: paid > 0 && paid < FREE_SHIPPING_THRESHOLD ? round2(FREE_SHIPPING_THRESHOLD - paid) : 0,
  };
}
