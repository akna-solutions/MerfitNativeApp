import { CollectionKey, SortKey } from "../types";

// Arama, filtre ve siralama sunucuda yapilir (GET /api/store/products); burada yalnizca etiketler vardir.

export const SORT_LABELS: Record<SortKey, string> = {
  featured: "Öne çıkanlar",
  bestsellers: "Çok satanlar",
  price_asc: "Fiyat: Düşükten yükseğe",
  price_desc: "Fiyat: Yüksekten düşüğe",
  discount: "En yüksek indirim",
  newest: "En yeniler",
  name_asc: "Ada göre (A-Z)",
};

export const COLLECTION_TITLES: Record<CollectionKey, string> = {
  featured: "Öne Çıkanlar",
  bestsellers: "Çok Satanlar",
  discounted: "İndirimdekiler",
  new: "Yeni Gelenler",
};

export const SORT_KEYS = Object.keys(SORT_LABELS) as SortKey[];
export const COLLECTION_KEYS = Object.keys(COLLECTION_TITLES) as CollectionKey[];

export function isSortKey(value: string | undefined): value is SortKey {
  return value !== undefined && (SORT_KEYS as string[]).includes(value);
}

export function isCollectionKey(value: string | undefined): value is CollectionKey {
  return value !== undefined && (COLLECTION_KEYS as string[]).includes(value);
}
