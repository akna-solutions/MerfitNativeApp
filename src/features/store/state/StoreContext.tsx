import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { storeServices } from "../services";
import { StoreServices } from "../services/types";
import { Campaign, CartItem, CartTotals, Category, DeliveryAddress, Order, PaymentMethod, Product, SelectedVariant } from "../types";
import { calculateTotals } from "../utils/pricing";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; message: string };

type StoreContextValue = {
  isLoading: boolean;
  /** Katalog yuklenemediyse kullaniciya gosterilecek metin. */
  error: string | null;
  reload: () => void;
  categories: Category[];
  campaigns: Campaign[];
  products: Product[];
  productsById: Map<string, Product>;
  cartItems: CartItem[];
  cartTotals: CartTotals;
  favoriteIds: string[];
  orders: Order[];
  addresses: DeliveryAddress[];
  addToCart: (input: { productId: string; quantity: number; selectedVariant: SelectedVariant }) => Promise<ActionResult>;
  setCartQuantity: (productId: string, selectedVariant: SelectedVariant, quantity: number) => Promise<void>;
  removeFromCart: (productId: string, selectedVariant: SelectedVariant) => Promise<void>;
  toggleFavorite: (productId: string) => Promise<void>;
  placeOrder: (input: { deliveryAddress: DeliveryAddress; paymentMethod: PaymentMethod }) => Promise<ActionResult<Order>>;
  saveAddress: (address: Omit<DeliveryAddress, "id"> & { id?: string }) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

const EMPTY_MAP = new Map<string, Product>();

function messageOf(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * Store durumunun tek sahibi. Veriyi yalnizca `services` arayuzleri uzerinden okur/yazar; dummy yerine HTTP
 * servisi verildiginde ekranlar degismez. Sepet/favori/siparis durumu uygulama acikken ekranlar arasinda paylasilir.
 */
export function StoreProvider({ children, services = storeServices }: { children: ReactNode; services?: StoreServices }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      services.catalog.getCategories(),
      services.catalog.getCampaigns(),
      services.catalog.getProducts(),
      services.cart.getItems(),
      services.favorites.getFavoriteIds(),
      services.orders.getOrders(),
      services.addresses.getAddresses(),
    ])
      .then(([cats, camps, prods, cart, favs, ords, addrs]) => {
        if (!active) return;
        setCategories(cats);
        setCampaigns(camps);
        setProducts(prods);
        setCartItems(cart);
        setFavoriteIds(favs);
        setOrders(ords);
        setAddresses(addrs);
      })
      .catch((e) => {
        if (active) setError(messageOf(e, "Store verileri yüklenemedi."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [services, reloadKey]);

  const productsById = useMemo(() => (products.length ? new Map(products.map((p) => [p.id, p])) : EMPTY_MAP), [products]);
  const cartTotals = useMemo(() => calculateTotals(cartItems, productsById), [cartItems, productsById]);

  const addToCart = useCallback<StoreContextValue["addToCart"]>(
    async (input) => {
      try {
        setCartItems(await services.cart.addItem(input));
        return { ok: true, data: undefined };
      } catch (e) {
        return { ok: false, message: messageOf(e, "Ürün sepete eklenemedi.") };
      }
    },
    [services],
  );

  const setCartQuantity = useCallback<StoreContextValue["setCartQuantity"]>(
    async (productId, selectedVariant, quantity) => setCartItems(await services.cart.setQuantity(productId, selectedVariant, quantity)),
    [services],
  );
  const removeFromCart = useCallback<StoreContextValue["removeFromCart"]>(
    async (productId, selectedVariant) => setCartItems(await services.cart.removeItem(productId, selectedVariant)),
    [services],
  );
  const toggleFavorite = useCallback<StoreContextValue["toggleFavorite"]>(
    async (productId) => setFavoriteIds(await services.favorites.toggle(productId)),
    [services],
  );

  const placeOrder = useCallback<StoreContextValue["placeOrder"]>(
    async ({ deliveryAddress, paymentMethod }) => {
      try {
        const order = await services.orders.createOrder({ items: cartItems, deliveryAddress, paymentMethod });
        // Siparis basariyla olustuktan sonra sepet temizlenir.
        setCartItems(await services.cart.clear());
        setOrders(await services.orders.getOrders());
        return { ok: true, data: order };
      } catch (e) {
        return { ok: false, message: messageOf(e, "Sipariş oluşturulamadı.") };
      }
    },
    [services, cartItems],
  );

  const saveAddress = useCallback<StoreContextValue["saveAddress"]>(async (a) => setAddresses(await services.addresses.saveAddress(a)), [services]);
  const removeAddress = useCallback<StoreContextValue["removeAddress"]>(async (id) => setAddresses(await services.addresses.removeAddress(id)), [services]);
  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      isLoading, error, reload, categories, campaigns, products, productsById, cartItems, cartTotals, favoriteIds, orders, addresses,
      addToCart, setCartQuantity, removeFromCart, toggleFavorite, placeOrder, saveAddress, removeAddress,
    }),
    [isLoading, error, reload, categories, campaigns, products, productsById, cartItems, cartTotals, favoriteIds, orders, addresses, addToCart, setCartQuantity, removeFromCart, toggleFavorite, placeOrder, saveAddress, removeAddress],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore() must be used within a <StoreProvider>");
  return ctx;
}
