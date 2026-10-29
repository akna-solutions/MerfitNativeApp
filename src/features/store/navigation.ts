import type { Href } from "expo-router";

import { CollectionKey, SortKey } from "./types";

/**
 * Store rota yardimcilari: rota dizgileri ve parametreler tek yerde, tipli. Rota dosyalari
 * src/app/pages/store/ altindadir (ince sarmalayicilar; ekran govdeleri features/store/screens'te).
 */
const href = (value: string) => value as unknown as Href;

export type ProductListParams = { campaignId?: string; categoryId?: string; collection?: CollectionKey; q?: string; sort?: SortKey; title?: string };

export const storeRoutes = {
  home: () => href("/pages/store"),
  product: (id: string) => href(`/pages/store/product/${id}`),
  list: (params: ProductListParams = {}) => ({ pathname: "/pages/store/products", params } as unknown as Href),
  cart: () => href("/pages/store/cart"),
  checkout: () => href("/pages/store/checkout"),
  orderSuccess: (orderId: string) => ({ pathname: "/pages/store/order-success", params: { orderId } } as unknown as Href),
  orders: () => href("/pages/store/orders"),
  order: (id: string) => href(`/pages/store/orders/${id}`),
  favorites: () => href("/pages/store/favorites"),
  addresses: () => href("/pages/store/addresses"),
  progress: () => href("/pages/progress"),
};
