import { apiRequest } from "./client";
import { FoodListItem, FoodListQuery, PagedResult } from "./types";

/** GET /api/foods - AddMealModal icin isme gore yiyecek arama. */
export async function searchFoods(query: FoodListQuery = {}): Promise<PagedResult<FoodListItem>> {
  return apiRequest<PagedResult<FoodListItem>>("/api/foods", {
    query: { search: query.search, page: query.page, pageSize: query.pageSize },
  });
}
