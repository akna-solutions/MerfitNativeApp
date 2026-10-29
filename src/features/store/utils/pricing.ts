import { Product, SelectedVariant } from "../types";

// Sepet ve siparis tutarlari YALNIZCA sunucudan gelir (bkz. services/mappers.ts). Buradaki yardimcilar urun
// detayinda secilen varyantin sunucudan gelen fiyat farkini gostermek ve fiyat bicimlemek icindir.

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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

/** Secilen varyantlar dahil guncel birim fiyat (onizleme; sepete eklenince sunucu yeniden hesaplar). */
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

/** Urun detayinda adet seciciyi sinirlar; sunucu da ayni siniri (satir basina en fazla 10, stok kadar) uygular. */
export const MAX_QUANTITY_PER_ITEM = 10;

export function maxQuantityFor(stock: number): number {
  return Math.max(0, Math.min(stock, MAX_QUANTITY_PER_ITEM));
}
