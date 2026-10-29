import { CAMPAIGNS } from "../data/campaigns";
import { INITIAL_ADDRESSES } from "../data/addresses";
import { CATEGORIES } from "../data/categories";
import { INITIAL_ORDERS } from "../data/orders";
import { PRODUCTS, PRODUCTS_BY_ID } from "../data/products";
import { CartItem, DeliveryAddress, Order, OrderItem, SelectedVariant } from "../types";
import { filterProducts } from "../utils/catalog";
import {
  calculateTotals,
  clampQuantity,
  isVariantSelectionComplete,
  originalUnitPriceFor,
  unitPriceFor,
  variantKey,
  variantLabel,
} from "../utils/pricing";
import { StoreServices } from "./types";

/**
 * Bellek ici (uygulama acikken kalici) dummy implementasyonlar. Ag istegi yapmaz. Her fabrika cagrisi
 * kendi durumunu olusturur; testler izole bir StoreServices alir.
 */
export function createDummyStoreServices(): StoreServices {
  let cart: CartItem[] = [];
  let favoriteIds: string[] = [];
  let orders: Order[] = [...INITIAL_ORDERS];
  let addresses: DeliveryAddress[] = [...INITIAL_ADDRESSES];
  let orderSeq = 1100;
  let addressSeq = 10;

  const sameLine = (item: CartItem, productId: string, selected: SelectedVariant) =>
    item.productId === productId && variantKey(item.selectedVariant) === variantKey(selected);

  return {
    catalog: {
      getCategories: async () => CATEGORIES,
      getCampaigns: async () => CAMPAIGNS,
      getProducts: async (filters) => (filters ? filterProducts(PRODUCTS, filters) : PRODUCTS),
      getProduct: async (id) => PRODUCTS_BY_ID.get(id) ?? null,
    },

    cart: {
      getItems: async () => cart,
      addItem: async ({ productId, quantity, selectedVariant }) => {
        const product = PRODUCTS_BY_ID.get(productId);
        if (!product) throw new Error("Ürün bulunamadı.");
        if (product.stock <= 0) throw new Error("Bu ürün stokta yok.");
        if (!isVariantSelectionComplete(product, selectedVariant)) throw new Error("Lütfen seçenekleri belirleyin.");
        const existing = cart.find((i) => sameLine(i, productId, selectedVariant));
        const nextQty = clampQuantity((existing?.quantity ?? 0) + Math.max(1, Math.floor(quantity)), product);
        if (existing) {
          cart = cart.map((i) => (i === existing ? { ...i, quantity: nextQty } : i));
        } else {
          cart = [...cart, { productId, quantity: nextQty, selectedVariant, unitPrice: unitPriceFor(product, selectedVariant) }];
        }
        return cart;
      },
      setQuantity: async (productId, selectedVariant, quantity) => {
        const product = PRODUCTS_BY_ID.get(productId);
        if (!product) return cart;
        if (quantity < 1) {
          cart = cart.filter((i) => !sameLine(i, productId, selectedVariant));
        } else {
          const qty = clampQuantity(quantity, product);
          cart = cart.map((i) => (sameLine(i, productId, selectedVariant) ? { ...i, quantity: qty } : i));
        }
        return cart;
      },
      removeItem: async (productId, selectedVariant) => {
        cart = cart.filter((i) => !sameLine(i, productId, selectedVariant));
        return cart;
      },
      clear: async () => {
        cart = [];
        return cart;
      },
    },

    favorites: {
      getFavoriteIds: async () => favoriteIds,
      toggle: async (productId) => {
        favoriteIds = favoriteIds.includes(productId) ? favoriteIds.filter((id) => id !== productId) : [productId, ...favoriteIds];
        return favoriteIds;
      },
    },

    orders: {
      getOrders: async () => orders,
      getOrder: async (id) => orders.find((o) => o.id === id) ?? null,
      createOrder: async ({ items, deliveryAddress, paymentMethod }) => {
        if (items.length === 0) throw new Error("Sepet boş.");
        const totals = calculateTotals(items, PRODUCTS_BY_ID);
        const orderItems: OrderItem[] = items.map((item) => {
          const product = PRODUCTS_BY_ID.get(item.productId);
          if (!product) throw new Error("Sepetteki bir ürün artık mevcut değil.");
          if (product.stock < item.quantity) throw new Error(`${product.name} için yeterli stok yok.`);
          return {
            productId: item.productId,
            name: product.name,
            brand: product.brand,
            image: product.images[0] ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            originalUnitPrice: originalUnitPriceFor(product, item.selectedVariant),
            variantLabel: variantLabel(product, item.selectedVariant),
          };
        });
        orderSeq += 1;
        const now = new Date();
        const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        const order: Order = {
          id: `MBF-${stamp}-${orderSeq}`,
          createdAt: now.toISOString(),
          items: orderItems,
          deliveryAddress,
          subtotal: totals.subtotal,
          discount: totals.discount,
          shippingCost: totals.shippingCost,
          total: totals.total,
          status: "received",
          paymentMethod,
          estimatedDelivery: "3-5 iş günü içinde (demo)",
        };
        orders = [order, ...orders];
        return order;
      },
    },

    addresses: {
      getAddresses: async () => addresses,
      saveAddress: async (input) => {
        if (input.id && addresses.some((a) => a.id === input.id)) {
          addresses = addresses.map((a) => (a.id === input.id ? { ...input, id: input.id } : a));
        } else {
          addressSeq += 1;
          addresses = [...addresses, { ...input, id: `addr-${addressSeq}` }];
        }
        return addresses;
      },
      removeAddress: async (id) => {
        addresses = addresses.filter((a) => a.id !== id);
        return addresses;
      },
    },
  };
}
