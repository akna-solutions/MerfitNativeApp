import { useCallback, useMemo } from "react";

import { useStore } from "../state/StoreContext";
import { Product, ProductFilters } from "../types";
import { filterProducts } from "../utils/catalog";

export { useStore } from "../state/StoreContext";

export function useCart() {
  const { cartItems, cartTotals, productsById, addToCart, setCartQuantity, removeFromCart } = useStore();
  return { items: cartItems, totals: cartTotals, productsById, addToCart, setQuantity: setCartQuantity, remove: removeFromCart };
}

export function useFavorites() {
  const { favoriteIds, toggleFavorite, productsById } = useStore();
  const favorites = useMemo(() => favoriteIds.map((id) => productsById.get(id)).filter((p): p is Product => Boolean(p)), [favoriteIds, productsById]);
  const isFavorite = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds]);
  return { favoriteIds, favorites, isFavorite, toggle: toggleFavorite };
}

export function useOrders() {
  const { orders, placeOrder } = useStore();
  const getOrder = useCallback((id: string) => orders.find((o) => o.id === id) ?? null, [orders]);
  return { orders, getOrder, placeOrder };
}

export function useAddresses() {
  const { addresses, saveAddress, removeAddress } = useStore();
  return { addresses, save: saveAddress, remove: removeAddress };
}

export function useProduct(id: string | undefined): Product | null {
  const { productsById } = useStore();
  return id ? (productsById.get(id) ?? null) : null;
}

/** Filtre/sirala/ara; sonuc yalnizca girdiler degisince yeniden hesaplanir. */
export function useProductList(filters: ProductFilters): Product[] {
  const { products } = useStore();
  const { query, categoryId, collection, inStockOnly, discountedOnly, brands, minPrice, maxPrice, sort } = filters;
  const brandKey = brands?.join("|") ?? "";
  return useMemo(
    () => filterProducts(products, { query, categoryId, collection, inStockOnly, discountedOnly, brands: brandKey ? brandKey.split("|") : undefined, minPrice, maxPrice, sort }),
    [products, query, categoryId, collection, inStockOnly, discountedOnly, brandKey, minPrice, maxPrice, sort],
  );
}
