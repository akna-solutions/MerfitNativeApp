import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { describeError, useStore } from "../state/StoreContext";
import { CheckoutOptions, Order, OrderListItem, Product, ProductFilters, ProductSummary } from "../types";
import { FALLBACK_PRODUCT_ICON } from "../components/categoryIcons";

export { useStore } from "../state/StoreContext";

export function useCart() {
  const { cart, addToCart, setCartQuantity, removeFromCart, refreshCart } = useStore();
  return { cart, items: cart.items, totals: cart.totals, addToCart, setQuantity: setCartQuantity, remove: removeFromCart, refresh: refreshCart };
}

export function useFavorites() {
  const { favoriteIds, toggleFavorite } = useStore();
  const isFavorite = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds]);
  return { favoriteIds, isFavorite, toggle: toggleFavorite };
}

export function useAddresses() {
  const { addresses, saveAddress, removeAddress } = useStore();
  return { addresses, save: saveAddress, remove: removeAddress };
}

/** Kategorinin ikonu (gorsel yokken yedek gorunum icin). */
export function useCategoryIcon(categoryId: string | undefined): string {
  const { categories } = useStore();
  return useMemo(() => categories.find((c) => c.id === categoryId)?.icon ?? FALLBACK_PRODUCT_ICON, [categories, categoryId]);
}

/** Debounce: arama kutusu her tusta istek atmasin. */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

type AsyncState<T> = { data: T | null; isLoading: boolean; error: string | null; notFound: boolean };

/**
 * Tek seferlik okuma: yukleniyor / hata / bulunamadi durumlari ve tekrar dene. Bilesen kapaninca veya girdi
 * degisince devam eden istek iptal edilir.
 */
function useServerData<T>(load: ((signal: AbortSignal) => Promise<T>) | null, deps: unknown[]) {
  const { isLoading: storeLoading } = useStore();
  const [state, setState] = useState<AsyncState<T>>({ data: null, isLoading: load !== null, error: null, notFound: false });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!load || storeLoading) return;
    const controller = new AbortController();
    setState((s) => ({ ...s, isLoading: true, error: null, notFound: false }));
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, isLoading: false, error: null, notFound: false });
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        const info = describeError(e, "Bilgiler yüklenemedi. Lütfen tekrar dene.");
        setState({ data: null, isLoading: false, error: info.message, notFound: info.status === 404 });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey, storeLoading]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { ...state, reload, setData: (data: T) => setState({ data, isLoading: false, error: null, notFound: false }) };
}

export function useProductDetail(id: string | undefined) {
  const { services } = useStore();
  const result = useServerData<Product>(id ? (signal) => services.catalog.getProduct(id, signal) : null, [services, id]);
  return { product: result.data, isLoading: result.isLoading, error: result.error, notFound: result.notFound || !id, reload: result.reload };
}

export function useOrderDetail(id: string | undefined) {
  const { services, ordersVersion } = useStore();
  const result = useServerData<Order>(id ? (signal) => services.orders.get(id, signal) : null, [services, id, ordersVersion]);
  return { order: result.data, isLoading: result.isLoading, error: result.error, notFound: result.notFound || !id, reload: result.reload, setOrder: result.setData };
}

export function useCheckoutOptions() {
  const { services } = useStore();
  const result = useServerData<CheckoutOptions>((signal) => services.orders.getCheckoutOptions(signal), [services]);
  return { options: result.data, isLoading: result.isLoading, error: result.error, reload: result.reload };
}

export function useBrands(categoryId: string | undefined) {
  const { services } = useStore();
  const result = useServerData<string[]>((signal) => services.catalog.getBrands(categoryId, signal), [services, categoryId]);
  return result.data ?? [];
}

/** Favori urunler (sunucudan). Favori listesi degisince yeniden yuklenir. */
export function useFavoriteProducts() {
  const { services, favoriteIds } = useStore();
  const key = favoriteIds.join(",");
  const result = useServerData<ProductSummary[]>((signal) => services.favorites.list(signal), [services, key]);
  // Kaldirilan urun yanit gelmeden listeden duser.
  const products = useMemo(() => (result.data ?? []).filter((p) => favoriteIds.includes(p.id)), [result.data, favoriteIds]);
  return { products, isLoading: result.isLoading && !result.data, error: result.error, reload: result.reload };
}

type PagedState<T> = { items: T[]; totalCount: number; hasNextPage: boolean; page: number; isLoading: boolean; isLoadingMore: boolean; error: string | null };

const INITIAL_PAGED: PagedState<never> = { items: [], totalCount: 0, hasNextPage: false, page: 0, isLoading: true, isLoadingMore: false, error: null };

/** Sayfali liste: ilk sayfa, sonraki sayfa (sonsuz kaydirma), yenile ve hata durumu. */
function usePagedList<T extends { id: string }>(
  loadPage: (page: number, signal: AbortSignal) => Promise<{ items: T[]; totalCount: number; hasNextPage: boolean }>,
  key: string,
  enabled = true,
) {
  const { isLoading: storeLoading } = useStore();
  const [state, setState] = useState<PagedState<T>>(INITIAL_PAGED);
  const [reloadKey, setReloadKey] = useState(0);
  const loadRef = useRef(loadPage);
  loadRef.current = loadPage;
  const stateRef = useRef(state);
  stateRef.current = state;
  const generationRef = useRef(0);
  const lastKeyRef = useRef(key);
  const moreControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || storeLoading) return;
    const generation = ++generationRef.current;
    moreControllerRef.current?.abort();
    const controller = new AbortController();
    // Filtre degistiyse eski sonuclar hemen kalkar; yalnizca yenilemede liste yerinde kalir.
    const keepItems = lastKeyRef.current === key;
    lastKeyRef.current = key;
    setState((s) => (keepItems ? { ...s, isLoading: true, error: null } : INITIAL_PAGED));
    loadRef.current(1, controller.signal)
      .then((result) => {
        if (generation !== generationRef.current) return;
        setState({ items: result.items, totalCount: result.totalCount, hasNextPage: result.hasNextPage, page: 1, isLoading: false, isLoadingMore: false, error: null });
      })
      .catch((e) => {
        if (generation !== generationRef.current || controller.signal.aborted) return;
        setState({ ...INITIAL_PAGED, isLoading: false, error: describeError(e, "Liste yüklenemedi. Lütfen tekrar dene.").message });
      });
    return () => controller.abort();
  }, [key, reloadKey, enabled, storeLoading]);

  const loadMore = useCallback(() => {
    const s = stateRef.current;
    if (s.isLoading || s.isLoadingMore || !s.hasNextPage) return;
    const generation = generationRef.current;
    const controller = new AbortController();
    moreControllerRef.current = controller;
    const nextPage = s.page + 1;
    stateRef.current = { ...s, isLoadingMore: true, error: null };
    setState(stateRef.current);
    loadRef.current(nextPage, controller.signal)
      .then((result) => {
        if (generation !== generationRef.current) return;
        setState((cur) => {
          const seen = new Set(cur.items.map((i) => i.id));
          const fresh = result.items.filter((i) => !seen.has(i.id));
          return { ...cur, items: [...cur.items, ...fresh], totalCount: result.totalCount, hasNextPage: result.hasNextPage, page: nextPage, isLoadingMore: false };
        });
      })
      .catch((e) => {
        if (generation !== generationRef.current || controller.signal.aborted) return;
        setState((cur) => ({ ...cur, isLoadingMore: false, error: describeError(e, "Daha fazla kayıt yüklenemedi.").message }));
      });
  }, []);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { ...state, isLoading: state.isLoading || (enabled && storeLoading), loadMore, reload };
}

/** Sunucuda filtrelenen/siralanan sayfali urun listesi. */
export function useProductQuery(filters: ProductFilters, options: { pageSize?: number; enabled?: boolean } = {}) {
  const { services } = useStore();
  const { pageSize = 20, enabled = true } = options;
  const key = JSON.stringify({ ...filters, brands: filters.brands?.slice().sort(), pageSize });
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  return usePagedList<ProductSummary>((page, signal) => services.catalog.getProducts(filtersRef.current, page, pageSize, signal), key, enabled);
}

export function useOrderList(pageSize = 20) {
  const { services, ordersVersion } = useStore();
  return usePagedList<OrderListItem>((page, signal) => services.orders.list(page, pageSize, signal), `orders:${pageSize}:${ordersVersion}`);
}
