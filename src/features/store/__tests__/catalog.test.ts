import { CAMPAIGNS } from "../data/campaigns";
import { CATEGORIES } from "../data/categories";
import { PRODUCTS, PRODUCTS_BY_ID } from "../data/products";
import { filterProducts, matchesQuery, normalizeText, relatedProducts, similarProducts, sortProducts } from "../utils/catalog";

describe("catalog", () => {
  it("Turkce karakter ve buyuk/kucuk harf farkini yok sayarak arar", () => {
    expect(normalizeText("ŞEKERSİZ Çikolata")).toBe("sekersiz cikolata");
    expect(matchesQuery(PRODUCTS_BY_ID.get("p-001")!, "CIKOLATA")).toBe(true);
    expect(matchesQuery(PRODUCTS_BY_ID.get("p-001")!, "whey çikolata")).toBe(true);
    expect(matchesQuery(PRODUCTS_BY_ID.get("p-001")!, "nutriforce")).toBe(true);
    expect(matchesQuery(PRODUCTS_BY_ID.get("p-001")!, "kettlebell")).toBe(false);
  });

  it("urun adi ve marka uzerinden filtreler", () => {
    expect(filterProducts(PRODUCTS, { query: "ironpeak" }).every((p) => p.brand === "IronPeak")).toBe(true);
    expect(filterProducts(PRODUCTS, { query: "protein" }).map((p) => p.id)).toContain("p-001");
    expect(filterProducts(PRODUCTS, { query: "olmayan urun xyz" })).toEqual([]);
  });

  it("kategori filtresi yalnizca o kategorinin urunlerini getirir", () => {
    for (const c of CATEGORIES) {
      const list = filterProducts(PRODUCTS, { categoryId: c.id });
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((p) => p.categoryId === c.id)).toBe(true);
    }
  });

  it("koleksiyonlar farkli ve bos olmayan listeler uretir", () => {
    const keys = ["bestsellers", "discounted", "forYou", "new"] as const;
    const lists = keys.map((collection) => filterProducts(PRODUCTS, { collection }).map((p) => p.id).join(","));
    lists.forEach((l) => expect(l.length).toBeGreaterThan(0));
    expect(new Set(lists).size).toBe(4);
    expect(filterProducts(PRODUCTS, { collection: "discounted" }).every((p) => p.discountPercentage > 0)).toBe(true);
  });

  it("stok, indirim, marka ve fiyat filtrelerini birlikte uygular", () => {
    expect(filterProducts(PRODUCTS, { inStockOnly: true }).every((p) => p.stock > 0)).toBe(true);
    expect(filterProducts(PRODUCTS, { discountedOnly: true }).every((p) => p.discountPercentage > 0)).toBe(true);
    expect(filterProducts(PRODUCTS, { brands: ["PureLab", "ZenMove"] }).every((p) => ["PureLab", "ZenMove"].includes(p.brand))).toBe(true);
    const ranged = filterProducts(PRODUCTS, { minPrice: 250, maxPrice: 750 });
    expect(ranged.length).toBeGreaterThan(0);
    expect(ranged.every((p) => p.price >= 250 && p.price <= 750)).toBe(true);
  });

  it("siralama tum anahtarlarda dogru sirayi verir", () => {
    const asc = sortProducts(PRODUCTS, "price_asc").map((p) => p.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = sortProducts(PRODUCTS, "price_desc").map((p) => p.price);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    const disc = sortProducts(PRODUCTS, "discount").map((p) => p.discountPercentage);
    expect(disc).toEqual([...disc].sort((a, b) => b - a));
    const rating = sortProducts(PRODUCTS, "rating").map((p) => p.rating);
    expect(rating).toEqual([...rating].sort((a, b) => b - a));
    expect(sortProducts(PRODUCTS, "newest")[0].tags).toContain("new");
  });

  it("benzer ve ilgili urunler kendini icermez; benzerler ayni kategoridendir", () => {
    const p = PRODUCTS_BY_ID.get("p-009")!;
    const similar = similarProducts(p, PRODUCTS);
    expect(similar.length).toBeGreaterThan(0);
    expect(similar.every((s) => s.id !== p.id && s.categoryId === p.categoryId)).toBe(true);
    const related = relatedProducts(p, PRODUCTS);
    expect(related.every((r) => r.id !== p.id && r.categoryId !== p.categoryId)).toBe(true);
  });

  it("kampanyalar gecerli urunlere baglidir ve indirimi urunlerden turetir", () => {
    expect(CAMPAIGNS.map((c) => c.title)).toEqual(
      expect.arrayContaining(["Spor Giyiminde Sezon Fırsatları", "Fitness Ekipmanlarında Özel İndirim", "Protein ve Beslenme Ürünleri", "MBFit'e Özel Fırsatlar"]),
    );
    for (const c of CAMPAIGNS) {
      expect(c.productIds.every((id) => PRODUCTS_BY_ID.has(id))).toBe(true);
      expect(c.discountPercentage).toBe(Math.max(...c.productIds.map((id) => PRODUCTS_BY_ID.get(id)!.discountPercentage)));
    }
  });

  it("her urunun kategorisi mevcuttur", () => {
    const ids = new Set(CATEGORIES.map((c) => c.id));
    expect(PRODUCTS.every((p) => ids.has(p.categoryId))).toBe(true);
  });
});
