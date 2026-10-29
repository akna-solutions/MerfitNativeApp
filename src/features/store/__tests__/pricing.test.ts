import { PRODUCTS, PRODUCTS_BY_ID } from "../data/products";
import { CartItem } from "../types";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  calculateTotals,
  clampQuantity,
  discountPercent,
  formatPrice,
  isVariantSelectionComplete,
  originalUnitPriceFor,
  shippingFor,
  unitPriceFor,
  variantKey,
  variantLabel,
} from "../utils/pricing";

const product = (id: string) => {
  const p = PRODUCTS_BY_ID.get(id);
  if (!p) throw new Error(id);
  return p;
};

describe("pricing", () => {
  it("indirim yuzdesini eski ve guncel fiyattan hesaplar", () => {
    expect(discountPercent(200, 150)).toBe(25);
    expect(discountPercent(100, 100)).toBe(0);
    expect(discountPercent(100, 120)).toBe(0);
    expect(discountPercent(0, 0)).toBe(0);
  });

  it("fiyati Turk lirasi olarak bicimlendirir", () => {
    expect(formatPrice(1349.9)).toMatch(/1\.349,90/);
    expect(formatPrice(1349.9)).toContain("₺");
  });

  it("varyant fiyat farkini hem guncel hem eski fiyata ekler", () => {
    const whey = product("p-001");
    expect(unitPriceFor(whey, { package: "2kg", flavor: "choc" })).toBe(1349.9);
    expect(unitPriceFor(whey, { package: "3kg", flavor: "choc" })).toBe(1869.9);
    expect(originalUnitPriceFor(whey, { package: "1kg", flavor: "choc" })).toBe(1049.9);
  });

  it("varyant secimi eksik veya stoksuzsa tamamlanmis saymaz", () => {
    const whey = product("p-001");
    expect(isVariantSelectionComplete(whey, {})).toBe(false);
    expect(isVariantSelectionComplete(whey, { package: "2kg" })).toBe(false);
    expect(isVariantSelectionComplete(whey, { package: "2kg", flavor: "caramel" })).toBe(false);
    expect(isVariantSelectionComplete(whey, { package: "2kg", flavor: "vanilla" })).toBe(true);
    expect(isVariantSelectionComplete(product("p-011"), {})).toBe(true);
  });

  it("varyant etiketini ve anahtarini kararli uretir", () => {
    const whey = product("p-001");
    expect(variantLabel(whey, { package: "2kg", flavor: "vanilla" })).toBe("2 kg · Vanilya");
    expect(variantKey({ b: "2", a: "1" })).toBe(variantKey({ a: "1", b: "2" }));
  });

  it("adedi 1 ile stok/azami sinir arasinda tutar", () => {
    const low = product("p-011"); // stok 9
    expect(clampQuantity(0, low)).toBe(1);
    expect(clampQuantity(50, low)).toBe(9);
    expect(clampQuantity(NaN, low)).toBe(1);
    expect(clampQuantity(3, product("p-014"))).toBe(3);
    expect(clampQuantity(99, product("p-014"))).toBe(10);
    expect(clampQuantity(2, product("p-003"))).toBe(0); // stokta yok
  });

  it("kargo esigini uygular", () => {
    expect(shippingFor(0)).toBe(0);
    expect(shippingFor(FREE_SHIPPING_THRESHOLD - 0.01)).toBe(SHIPPING_FEE);
    expect(shippingFor(FREE_SHIPPING_THRESHOLD)).toBe(0);
  });

  it("sepet toplamlarini tek fonksiyonda tutarli hesaplar", () => {
    const items: CartItem[] = [
      { productId: "p-005", quantity: 2, selectedVariant: { size: "m", color: "black" }, unitPrice: 299.9 }, // liste 399.9
      { productId: "p-014", quantity: 1, selectedVariant: { color: "black" }, unitPrice: 129.9 }, // indirimsiz
    ];
    const t = calculateTotals(items, PRODUCTS_BY_ID);
    expect(t.itemCount).toBe(3);
    expect(t.subtotal).toBe(929.7); // 2*399.9 + 129.9
    expect(t.discount).toBe(200); // 2*(399.9-299.9)
    expect(t.shippingCost).toBe(0); // 729.7 >= 500
    expect(t.total).toBe(729.7);
    expect(t.total).toBeCloseTo(t.subtotal - t.discount + t.shippingCost, 2);
  });

  it("esigin altinda kargo ekler ve kalan tutari bildirir", () => {
    const items: CartItem[] = [{ productId: "p-014", quantity: 1, selectedVariant: { color: "black" }, unitPrice: 129.9 }];
    const t = calculateTotals(items, PRODUCTS_BY_ID);
    expect(t.shippingCost).toBe(SHIPPING_FEE);
    expect(t.total).toBe(179.8);
    expect(t.remainingForFreeShipping).toBe(370.1);
  });

  it("bos sepette her sey sifirdir", () => {
    expect(calculateTotals([], PRODUCTS_BY_ID)).toEqual({ itemCount: 0, subtotal: 0, discount: 0, shippingCost: 0, total: 0, remainingForFreeShipping: 0 });
  });
});

describe("dummy urun verisi", () => {
  it("en az 16 urun icerir ve idler tekildir", () => {
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(16);
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(PRODUCTS.length);
  });

  it("indirim yuzdesi fiyatlardan turetilmistir ve fiyatlar tutarlidir", () => {
    for (const p of PRODUCTS) {
      expect(p.originalPrice).toBeGreaterThanOrEqual(p.price);
      expect(p.discountPercentage).toBe(discountPercent(p.originalPrice, p.price));
      expect(p.rating).toBeGreaterThan(0);
      expect(p.rating).toBeLessThanOrEqual(5);
    }
  });

  it("indirimli ve indirimsiz, stoklu ve stoksuz urunler ile birden fazla marka vardir", () => {
    expect(PRODUCTS.some((p) => p.discountPercentage > 0)).toBe(true);
    expect(PRODUCTS.some((p) => p.discountPercentage === 0)).toBe(true);
    expect(PRODUCTS.some((p) => p.stock === 0)).toBe(true);
    expect(PRODUCTS.some((p) => p.stock > 0)).toBe(true);
    expect(new Set(PRODUCTS.map((p) => p.brand)).size).toBeGreaterThanOrEqual(5);
  });

  it("varyantli urunlerde her grubun en az bir stoklu secenegi vardir", () => {
    for (const p of PRODUCTS) {
      for (const g of p.variants) expect(g.options.some((o) => o.inStock !== false)).toBe(true);
    }
  });
});
