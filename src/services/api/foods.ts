import { apiRequest } from "./client";
import { FoodListItem, FoodListQuery, PagedResult } from "./types";

/** GET /api/foods - AddMealModal icin isme gore yiyecek arama. */
export async function searchFoods(query: FoodListQuery = {}): Promise<PagedResult<FoodListItem>> {
  return apiRequest<PagedResult<FoodListItem>>("/api/foods", {
    query: { search: query.search, page: query.page, pageSize: query.pageSize },
  });
}

/**
 * GET /api/foods/barcode/{barcode} - barkoda ait besini getirir. Katalogda yoksa backend
 * Open Food Facts'ten 100 g/ml degerleriyle bulup ekler. Bulunamazsa 404, servise
 * ulasilamazsa 503 ApiError firlatir.
 */
export async function getFoodByBarcode(barcode: string, signal?: AbortSignal): Promise<FoodListItem> {
  return apiRequest<FoodListItem>(`/api/foods/barcode/${encodeURIComponent(barcode)}`, { signal });
}
