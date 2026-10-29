import { CollectionKey, Product, ProductFilters, SortKey } from "../types";

export const SORT_LABELS: Record<SortKey, string> = {
  featured: "Öne çıkanlar",
  price_asc: "Fiyat: Düşükten yükseğe",
  price_desc: "Fiyat: Yüksekten düşüğe",
  discount: "En yüksek indirim",
  rating: "En yüksek puan",
  newest: "En yeniler",
};

export const COLLECTION_TITLES: Record<CollectionKey, string> = {
  bestsellers: "Çok Satanlar",
  discounted: "İndirimdekiler",
  forYou: "Senin İçin Seçtiklerimiz",
  new: "Yeni Gelenler",
};

/** Turkce karakterleri ve buyuk/kucuk harf farkini yok sayan arama anahtari. */
export function normalizeText(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesQuery(product: Product, query: string): boolean {
  const terms = normalizeText(query).split(" ").filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalizeText(`${product.name} ${product.brand}`);
  return terms.every((term) => haystack.includes(term));
}

export function inCollection(product: Product, collection: CollectionKey): boolean {
  switch (collection) {
    case "bestsellers":
      return product.tags.includes("bestseller");
    case "discounted":
      return product.discountPercentage > 0;
    case "forYou":
      return product.tags.includes("recommended");
    case "new":
      return product.tags.includes("new");
  }
}

export function sortProducts(products: Product[], sort: SortKey = "featured"): Product[] {
  const list = [...products];
  switch (sort) {
    case "price_asc":
      return list.sort((a, b) => a.price - b.price);
    case "price_desc":
      return list.sort((a, b) => b.price - a.price);
    case "discount":
      return list.sort((a, b) => b.discountPercentage - a.discountPercentage || b.rating - a.rating);
    case "rating":
      return list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case "newest":
      return list.sort((a, b) => Number(b.tags.includes("new")) - Number(a.tags.includes("new")) || b.id.localeCompare(a.id));
    case "featured":
    default:
      return list.sort((a, b) => b.reviewCount - a.reviewCount);
  }
}

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  const filtered = products.filter((p) => {
    if (filters.query && !matchesQuery(p, filters.query)) return false;
    if (filters.categoryId && p.categoryId !== filters.categoryId) return false;
    if (filters.collection && !inCollection(p, filters.collection)) return false;
    if (filters.inStockOnly && p.stock <= 0) return false;
    if (filters.discountedOnly && p.discountPercentage <= 0) return false;
    if (filters.brands && filters.brands.length > 0 && !filters.brands.includes(p.brand)) return false;
    if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
    return true;
  });
  return sortProducts(filtered, filters.sort);
}

/** Ayni kategorideki, aralarinda kendisi olmayan benzer urunler; bos kalirsa ayni markadakiler eklenir. */
export function similarProducts(product: Product, all: Product[], limit = 8): Product[] {
  return all.filter((p) => p.id !== product.id && p.categoryId === product.categoryId).slice(0, limit);
}

/** Farkli kategoriden, ayni markadan veya ortak etiketli ilgili urunler. */
export function relatedProducts(product: Product, all: Product[], limit = 8): Product[] {
  const shared = (p: Product) => p.tags.filter((t) => product.tags.includes(t) && t !== "bestseller" && t !== "new" && t !== "recommended").length;
  return all
    .filter((p) => p.id !== product.id && p.categoryId !== product.categoryId)
    .map((p) => ({ p, score: (p.brand === product.brand ? 2 : 0) + shared(p) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p)
    .slice(0, limit);
}
