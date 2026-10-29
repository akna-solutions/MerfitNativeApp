import { fakeProducts } from "../../../test/storeFakes";
import { formatPrice, isVariantSelectionComplete, maxQuantityFor, originalUnitPriceFor, round2, unitPriceFor } from "../utils/pricing";

const product = (id: string) => {
  const p = fakeProducts().find((x) => x.id === id);
  if (!p) throw new Error(id);
  return p;
};

describe("pricing (yalnizca gosterim yardimcilari; tutarlar sunucudan gelir)", () => {
  it("fiyati Turk lirasi olarak bicimlendirir", () => {
    expect(formatPrice(1349.9)).toMatch(/1\.349,90/);
    expect(formatPrice(1349.9)).toContain("₺");
  });

  it("kurus yuvarlamasini kayan nokta hatasi olmadan yapar", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(1.005)).toBe(1.01);
  });

  it("varyant fiyat farkini hem guncel hem eski fiyata ekler", () => {
    const whey = product("101");
    expect(unitPriceFor(whey, { package: "2kg", flavor: "choc" })).toBe(1400);
    expect(unitPriceFor(whey, { package: "1kg", flavor: "choc" })).toBe(1000);
    expect(originalUnitPriceFor(whey, { package: "2kg", flavor: "choc" })).toBe(1600);
  });

  it("varyant secimi eksik veya stoksuzsa tamamlanmis saymaz", () => {
    const whey = product("101");
    expect(isVariantSelectionComplete(whey, {})).toBe(false);
    expect(isVariantSelectionComplete(whey, { package: "2kg" })).toBe(false);
    expect(isVariantSelectionComplete(whey, { package: "2kg", flavor: "caramel" })).toBe(false);
    expect(isVariantSelectionComplete(whey, { package: "2kg", flavor: "vanilla" })).toBe(true);
    expect(isVariantSelectionComplete(product("105"), {})).toBe(true);
  });

  it("adet sinirini stok ve satir basina 10 ile sinirlar", () => {
    expect(maxQuantityFor(9)).toBe(9);
    expect(maxQuantityFor(50)).toBe(10);
    expect(maxQuantityFor(0)).toBe(0);
    expect(maxQuantityFor(-3)).toBe(0);
  });
});
