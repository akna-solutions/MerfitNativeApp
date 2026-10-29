import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { ApiError, NetworkError } from "../../../services/api/client";
import { useAuth } from "../../../shared/auth/AuthContext";
import { storeServices } from "../services";
import { AddressInput, CreateOrderInput, StoreServices } from "../services/types";
import { Campaign, Cart, Category, DeliveryAddress, Order, SelectedVariant } from "../types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      message: string;
      /** Sunucunun 409 kodu (orn. PRICE_CHANGED, CART_CHANGED, OUT_OF_STOCK). */
      code?: string;
      /** Ag hatasi: ayni istek guvenle tekrar denenebilir. */
      network?: boolean;
    };

type LoadStatus = "idle" | "loading" | "ready" | "error";

type StoreContextValue = {
  services: StoreServices;
  /** Oturum acik ve ilk yukleme suruyor. */
  isLoading: boolean;
  /** Ilk yukleme basarisizsa kullaniciya gosterilecek metin. */
  error: string | null;
  reload: () => void;
  categories: Category[];
  campaigns: Campaign[];
  /** Sunucudaki sepet; tutarlar sunucuda hesaplanir. */
  cart: Cart;
  refreshCart: () => Promise<ActionResult>;
  addToCart: (input: { productId: string; quantity: number; selectedVariant: SelectedVariant }) => Promise<ActionResult>;
  setCartQuantity: (lineId: string, quantity: number) => Promise<ActionResult>;
  removeFromCart: (lineId: string) => Promise<ActionResult>;
  favoriteIds: string[];
  toggleFavorite: (productId: string) => Promise<ActionResult>;
  addresses: DeliveryAddress[];
  saveAddress: (input: AddressInput & { id?: string }) => Promise<ActionResult<DeliveryAddress>>;
  removeAddress: (id: string) => Promise<ActionResult>;
  orderCount: number;
  /** Siparis olusunca/iptal edilince artar; siparis listeleri bu degisince yeniden yuklenir. */
  ordersVersion: number;
  placeOrder: (input: CreateOrderInput) => Promise<ActionResult<Order>>;
  notifyOrdersChanged: () => void;
};

export const EMPTY_CART: Cart = {
  items: [],
  totals: { itemCount: 0, subtotal: 0, discount: 0, shippingCost: 0, total: 0, remainingForFreeShipping: 0, freeShippingThreshold: 0 },
  canCheckout: false,
};

const StoreContext = createContext<StoreContextValue | null>(null);

/** Hata nesnesini kullaniciya gosterilecek Turkce metne ve (varsa) sunucu koduna cevirir. */
export function describeError(error: unknown, fallback: string): { message: string; code?: string; network?: boolean; unauthorized?: boolean; status?: number } {
  if (error instanceof NetworkError || (error instanceof Error && error.name === "NetworkError")) {
    return { message: "Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.", network: true };
  }
  if (error instanceof ApiError || (error instanceof Error && error.name === "ApiError")) {
    const apiError = error as ApiError;
    const code = apiError.fieldErrors?.find((e) => /^[A-Z_]+$/.test(e));
    return { message: apiError.message || fallback, code, unauthorized: apiError.status === 401, status: apiError.status };
  }
  return { message: fallback };
}

/**
 * MB Shop durumunun tek sahibi: kategoriler, kampanyalar ve kullaniciya ait sepet, favoriler, adresler ve siparis
 * sayisi. Veri yalnizca `services` uzerinden (uygulamada MerfitCustomerApi) okunur/yazilir; yerel/sahte veriye
 * dusulmez. Oturum acilinca yuklenir, oturum degisince onceki kullanicinin verisi hemen temizlenir.
 */
export function StoreProvider({ children, services = storeServices }: { children: ReactNode; services?: StoreServices }) {
  const { status: authStatus, sessionVersion, forceSignOut } = useAuth();
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [ordersVersion, setOrdersVersion] = useState(0);
  // Oturum degisince artar; eski oturumun gec gelen yanitlari yeni kullanicinin durumunu ezmez.
  const sessionRef = useRef(0);
  // Yalnizca en son sepet isteminin yaniti uygulanir (hizli adet degisimlerinde sira karismasin).
  const cartRequestRef = useRef(0);

  const handleError = useCallback(
    (e: unknown, fallback: string) => {
      const info = describeError(e, fallback);
      if (info.unauthorized) forceSignOut();
      return info;
    },
    [forceSignOut],
  );

  useEffect(() => {
    const session = ++sessionRef.current;
    setCategories([]);
    setCampaigns([]);
    setCart(EMPTY_CART);
    setFavoriteIds([]);
    setAddresses([]);
    setOrderCount(0);
    setError(null);
    if (authStatus !== "signedIn") {
      setStatus("idle");
      return;
    }

    setStatus("loading");
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      services.catalog.getCategories(signal),
      services.catalog.getCampaigns(signal),
      services.cart.get(signal),
      services.favorites.list(signal),
      services.addresses.list(signal),
      services.orders.list(1, 1, signal),
    ])
      .then(([cats, camps, serverCart, favorites, addrs, orders]) => {
        if (session !== sessionRef.current) return;
        setCategories(cats);
        setCampaigns(camps);
        setCart(serverCart);
        setFavoriteIds(favorites.map((p) => p.id));
        setAddresses(addrs);
        setOrderCount(orders.totalCount);
        setStatus("ready");
      })
      .catch((e) => {
        if (session !== sessionRef.current || signal.aborted) return;
        setError(handleError(e, "MB Shop yüklenemedi. Lütfen tekrar dene.").message);
        setStatus("error");
      });
    return () => controller.abort();
  }, [services, authStatus, sessionVersion, reloadKey, handleError]);

  const runCartRequest = useCallback(
    async (request: () => Promise<Cart>, fallback: string): Promise<ActionResult> => {
      const session = sessionRef.current;
      const requestId = ++cartRequestRef.current;
      try {
        const next = await request();
        if (session === sessionRef.current && requestId === cartRequestRef.current) setCart(next);
        return { ok: true, data: undefined };
      } catch (e) {
        const info = handleError(e, fallback);
        // Stok/fiyat degismis olabilir: kullanicinin gordugu sepet sunucudakiyle esitlenir.
        if (info.status === 409 || info.status === 404) {
          services.cart
            .get()
            .then((fresh) => {
              if (session === sessionRef.current && requestId === cartRequestRef.current) setCart(fresh);
            })
            .catch(() => undefined);
        }
        return { ok: false, message: info.message, code: info.code, network: info.network };
      }
    },
    [services, handleError],
  );

  const refreshCart = useCallback(() => runCartRequest(() => services.cart.get(), "Sepet yüklenemedi."), [runCartRequest, services]);
  const addToCart = useCallback<StoreContextValue["addToCart"]>(
    (input) => runCartRequest(() => services.cart.add(input), "Ürün sepete eklenemedi."),
    [runCartRequest, services],
  );
  const setCartQuantity = useCallback<StoreContextValue["setCartQuantity"]>(
    (lineId, quantity) => runCartRequest(() => services.cart.setQuantity(lineId, quantity), "Adet güncellenemedi."),
    [runCartRequest, services],
  );
  const removeFromCart = useCallback<StoreContextValue["removeFromCart"]>(
    (lineId) => runCartRequest(() => services.cart.remove(lineId), "Ürün sepetten çıkarılamadı."),
    [runCartRequest, services],
  );

  const favoriteIdsRef = useRef(favoriteIds);
  favoriteIdsRef.current = favoriteIds;
  const toggleFavorite = useCallback<StoreContextValue["toggleFavorite"]>(
    async (productId) => {
      const session = sessionRef.current;
      const wasFavorite = favoriteIdsRef.current.includes(productId);
      // Iyimser guncelleme; sunucu reddederse geri alinir.
      setFavoriteIds((ids) => (wasFavorite ? ids.filter((id) => id !== productId) : [...ids, productId]));
      try {
        if (wasFavorite) await services.favorites.remove(productId);
        else await services.favorites.add(productId);
        return { ok: true, data: undefined };
      } catch (e) {
        if (session === sessionRef.current) {
          setFavoriteIds((ids) => (wasFavorite ? (ids.includes(productId) ? ids : [...ids, productId]) : ids.filter((id) => id !== productId)));
        }
        const info = handleError(e, "Favoriler güncellenemedi.");
        return { ok: false, message: info.message, network: info.network };
      }
    },
    [services, handleError],
  );

  const saveAddress = useCallback<StoreContextValue["saveAddress"]>(
    async ({ id, ...input }) => {
      const session = sessionRef.current;
      try {
        const saved = id ? await services.addresses.update(id, input) : await services.addresses.create(input);
        // Varsayilan adres degismis olabilir; liste sunucudan yenilenir.
        const list = await services.addresses.list();
        if (session === sessionRef.current) setAddresses(list);
        return { ok: true, data: saved };
      } catch (e) {
        const info = handleError(e, "Adres kaydedilemedi.");
        return { ok: false, message: info.message, network: info.network };
      }
    },
    [services, handleError],
  );

  const removeAddress = useCallback<StoreContextValue["removeAddress"]>(
    async (id) => {
      const session = sessionRef.current;
      try {
        await services.addresses.remove(id);
        const list = await services.addresses.list();
        if (session === sessionRef.current) setAddresses(list);
        return { ok: true, data: undefined };
      } catch (e) {
        const info = handleError(e, "Adres silinemedi.");
        return { ok: false, message: info.message, network: info.network };
      }
    },
    [services, handleError],
  );

  const notifyOrdersChanged = useCallback(() => {
    const session = sessionRef.current;
    setOrdersVersion((v) => v + 1);
    services.orders
      .list(1, 1)
      .then((page) => {
        if (session === sessionRef.current) setOrderCount(page.totalCount);
      })
      .catch(() => undefined);
  }, [services]);

  const placeOrder = useCallback<StoreContextValue["placeOrder"]>(
    async (input) => {
      try {
        const order = await services.orders.create(input);
        // Sunucu siparisle birlikte sepeti bosaltti; ekrandaki sepet de sunucudan yenilenir.
        await refreshCart();
        notifyOrdersChanged();
        return { ok: true, data: order };
      } catch (e) {
        const info = handleError(e, "Sipariş oluşturulamadı. Lütfen tekrar dene.");
        if (info.status === 409) await refreshCart();
        return { ok: false, message: info.message, code: info.code, network: info.network };
      }
    },
    [services, refreshCart, notifyOrdersChanged, handleError],
  );

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const isLoading = authStatus === "signedIn" && (status === "loading" || status === "idle");

  const value = useMemo<StoreContextValue>(
    () => ({
      services, isLoading, error, reload, categories, campaigns, cart, refreshCart, addToCart, setCartQuantity, removeFromCart,
      favoriteIds, toggleFavorite, addresses, saveAddress, removeAddress, orderCount, ordersVersion, placeOrder, notifyOrdersChanged,
    }),
    [services, isLoading, error, reload, categories, campaigns, cart, refreshCart, addToCart, setCartQuantity, removeFromCart,
      favoriteIds, toggleFavorite, addresses, saveAddress, removeAddress, orderCount, ordersVersion, placeOrder, notifyOrdersChanged],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore() must be used within a <StoreProvider>");
  return ctx;
}
