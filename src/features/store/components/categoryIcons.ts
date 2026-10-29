import { CATEGORIES } from "../data/categories";

/** Kategori id'sinden yedek gorsel ikonunu verir (veri tek kaynak: data/categories.ts). */
export function categoryIconFor(categoryId: string): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.icon ?? "image-outline";
}
