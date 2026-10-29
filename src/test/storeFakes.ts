import { ApiError } from "../services/api/client";
import { AddressInput, CreateOrderInput, StoreServices } from "../features/store/services/types";
import {
  Campaign,
  Cart,
  CartLine,
  Category,
  DeliveryAddress,
  Order,
  OrderListItem,
  Page,
  Product,
  ProductFilters,
  ProductSummary,
  SelectedVariant,
} from "../features/store/types";

/**
 * YALNIZCA TESTLER ICIN: MB Shop servis arayuzunun bellek ici sahte uygulamasi. Uygulama kodu bunu kullanmaz
 * (uygulamada services/http.ts gercek API'ye gider). Sunucunun kurallarini (fiyat/toplam hesaplama, stok ve satir
 * siniri, idempotent siparis, tutar degisikligi kontrolu, iptal) testlerin ekranlari gercekci sinayabilmesi icin
 * taklit eder; asil kurallar MerfitCustomerApi'de ve onun testlerindedir.
 */

const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 49.9;
const MAX_PER_LINE = 10;

type FakeProduct = Product & { isActive: boolean; isFeatured: boolean; createdAt: string; campaignIds: string[] };

const round2 = (n: number) => Math.round(n * 100) / 100;

export function fakeCategories(): Category[] {
  return [
    { id: "1", name: "Protein", slug: "protein", image: null, icon: "barbell-outline", parentId: null, productCount: 0 },
    { id: "2", name: "Giyim", slug: "giyim", image: null, icon: "shirt-outline", parentId: null, productCount: 0 },
    { id: "3", name: "Ekipman", slug: "ekipman", image: null, icon: "fitness-outline", parentId: null, productCount: 0 },
    { id: "4", name: "Protein Bar", slug: "protein-bar", image: null, icon: "nutrition-outline", parentId: "1", productCount: 0 },
  ];
}

function product(p: Partial<FakeProduct> & Pick<FakeProduct, "id" | "name" | "brand" | "categoryId" | "price">): FakeProduct {
  const originalPrice = p.originalPrice ?? p.price;
  return {
    stock: 10,
    image: null,
    hasVariants: Boolean(p.variants?.length),
    description: `${p.name} açıklaması`,
    categoryName: null,
    images: [],
    variants: [],
    features: [],
    specs: [],
    isActive: true,
    isFeatured: false,
    createdAt: "2026-10-01T10:00:00Z",
    campaignIds: [],
    ...p,
    originalPrice,
    discountPercentage: originalPrice > p.price ? Math.round(((originalPrice - p.price) / originalPrice) * 100) : 0,
  };
}

export function fakeProducts(): FakeProduct[] {
  return [
    product({
      id: "101",
      name: "Whey Protein",
      brand: "PureLab",
      categoryId: "1",
      price: 1000,
      originalPrice: 1200,
      isFeatured: true,
      campaignIds: ["1"],
      variants: [
        { id: "package", label: "Paket", kind: "package", options: [{ id: "1kg", label: "1 kg" }, { id: "2kg", label: "2 kg", priceDelta: 400 }] },
        {
          id: "flavor",
          label: "Aroma",
          kind: "option",
          options: [{ id: "choc", label: "Çikolata" }, { id: "vanilla", label: "Vanilya" }, { id: "caramel", label: "Karamel", inStock: false }],
        },
      ],
    }),
    product({ id: "102", name: "Kreatin", brand: "MBFit", categoryId: "1", price: 400, stock: 5, createdAt: "2026-10-20T10:00:00Z" }),
    product({ id: "103", name: "BCAA", brand: "PureLab", categoryId: "1", price: 350, stock: 0 }),
    product({
      id: "104",
      name: "Antrenman Tişörtü",
      brand: "MBFit",
      categoryId: "2",
      price: 300,
      originalPrice: 400,
      campaignIds: ["1"],
      variants: [{ id: "size", label: "Beden", kind: "size", options: [{ id: "m", label: "M" }, { id: "l", label: "L" }] }],
    }),
    product({ id: "105", name: "Kettlebell 12 kg", brand: "IronCo", categoryId: "3", price: 600, stock: 9 }),
    product({ id: "106", name: "Fıstıklı Protein Bar", brand: "PureLab", categoryId: "4", price: 60, stock: 50 }),
  ];
}

export function fakeAddress(overrides: Partial<DeliveryAddress> = {}): DeliveryAddress {
  return {
    id: "1",
    title: "Ev",
    fullName: "Ayşe Yılmaz",
    phone: "05321234567",
    city: "İstanbul",
    district: "Kadıköy",
    address: "Örnek Mah. Deneme Sok. No: 1",
    isDefault: true,
    ...overrides,
  };
}

type CartRow = { id: string; productId: string; selectedVariant: SelectedVariant; quantity: number };

export type FakeStore = {
  services: StoreServices;
  products: FakeProduct[];
  cartRows: CartRow[];
  addresses: DeliveryAddress[];
  orders: Order[];
  favorites: string[];
  /** Kart odemesi gibi gercek odeme saglayicisi yokken kapali yontemler. */
  cardAvailable: boolean;
};

export function createFakeStore(init: { cart?: Omit<CartRow, "id">[]; addresses?: DeliveryAddress[]; favorites?: string[] } = {}): FakeStore {
  const products = fakeProducts();
  const categories = fakeCategories();
  let seq = 1000;
  const nextId = () => String(++seq);
  const idempotency = new Map<string, string>();

  const state: FakeStore = {
    services: undefined as unknown as StoreServices,
    products,
    cartRows: (init.cart ?? []).map((row) => ({ ...row, id: nextId() })),
    addresses: init.addresses ?? [fakeAddress()],
    orders: [],
    favorites: init.favorites ?? [],
    cardAvailable: false,
  };

  const find = (id: string) => products.find((p) => p.id === id && p.isActive);
  const summary = (p: FakeProduct): ProductSummary => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    categoryId: p.categoryId,
    price: p.price,
    originalPrice: p.originalPrice,
    discountPercentage: p.discountPercentage,
    stock: p.stock,
    image: p.image,
    hasVariants: p.hasVariants,
  });
  const childIds = (id: string) => categories.filter((c) => c.parentId === id).map((c) => c.id);
  const inCategory = (p: FakeProduct, id: string) => p.categoryId === id || childIds(id).includes(p.categoryId);
  const delta = (p: FakeProduct, sel: SelectedVariant) =>
    p.variants.reduce((sum, g) => sum + (g.options.find((o) => o.id === sel[g.id])?.priceDelta ?? 0), 0);
  const label = (p: FakeProduct, sel: SelectedVariant) =>
    p.variants
      .map((g) => g.options.find((o) => o.id === sel[g.id])?.label)
      .filter(Boolean)
      .join(" · ");

  const buildCart = (): Cart => {
    const items: CartLine[] = state.cartRows.map((row) => {
      const p = products.find((x) => x.id === row.productId)!;
      const unitPrice = round2(p.price + delta(p, row.selectedVariant));
      const unitOriginalPrice = round2(p.originalPrice + delta(p, row.selectedVariant));
      const isAvailable = p.isActive && p.stock >= row.quantity;
      return {
        id: row.id,
        productId: p.id,
        categoryId: p.categoryId,
        name: p.name,
        brand: p.brand,
        image: p.image,
        selectedVariant: row.selectedVariant,
        variantLabel: label(p, row.selectedVariant),
        quantity: row.quantity,
        maxQuantity: Math.min(MAX_PER_LINE, p.stock),
        unitPrice,
        unitOriginalPrice,
        lineTotal: round2(unitPrice * row.quantity),
        lineOriginalTotal: round2(unitOriginalPrice * row.quantity),
        isAvailable,
        unavailableReason: isAvailable ? null : p.stock === 0 ? "Bu ürün stokta kalmadı." : `Stokta yalnızca ${p.stock} adet var.`,
      };
    });
    const available = items.filter((i) => i.isAvailable);
    const productsTotal = round2(available.reduce((s, i) => s + i.lineTotal, 0));
    const subtotal = round2(available.reduce((s, i) => s + i.lineOriginalTotal, 0));
    const shippingCost = available.length === 0 || productsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    return {
      items,
      canCheckout: items.length > 0 && items.every((i) => i.isAvailable),
      totals: {
        itemCount: items.reduce((s, i) => s + i.quantity, 0),
        subtotal,
        discount: round2(subtotal - productsTotal),
        shippingCost,
        total: round2(productsTotal + shippingCost),
        remainingForFreeShipping: productsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : round2(FREE_SHIPPING_THRESHOLD - productsTotal),
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      },
    };
  };

  const conflict = (message: string, code: string) => new ApiError(409, message, [code]);
  const notFound = (message: string) => new ApiError(404, message);
  const toListItem = (o: Order): OrderListItem => ({
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    total: o.total,
    itemCount: o.itemCount,
    itemNames: o.itemNames,
  });
  const page = <T,>(all: T[], pageNo: number, size: number): Page<T> => ({
    items: all.slice((pageNo - 1) * size, pageNo * size),
    page: pageNo,
    totalCount: all.length,
    hasNextPage: pageNo * size < all.length,
  });

  const filterProducts = (f: ProductFilters) => {
    const q = f.query?.trim().toLocaleLowerCase("tr-TR");
    let list = products.filter((p) => p.isActive);
    if (q) list = list.filter((p) => `${p.name} ${p.brand}`.toLocaleLowerCase("tr-TR").includes(q));
    if (f.categoryId) list = list.filter((p) => inCategory(p, f.categoryId!));
    if (f.campaignId) list = list.filter((p) => p.campaignIds.includes(f.campaignId!));
    if (f.collection === "discounted" || f.discountedOnly) list = list.filter((p) => p.originalPrice > p.price);
    if (f.collection === "featured") list = list.filter((p) => p.isFeatured);
    if (f.inStockOnly) list = list.filter((p) => p.stock > 0);
    if (f.brands?.length) list = list.filter((p) => f.brands!.includes(p.brand));
    if (f.minPrice !== undefined) list = list.filter((p) => p.price >= f.minPrice!);
    if (f.maxPrice !== undefined) list = list.filter((p) => p.price <= f.maxPrice!);
    if (f.excludeId) list = list.filter((p) => p.id !== f.excludeId);
    const sort = f.sort ?? (f.collection === "new" ? "newest" : "featured");
    const sorted = [...list];
    if (sort === "price_asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "discount") sorted.sort((a, b) => b.discountPercentage - a.discountPercentage);
    else if (sort === "newest") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else if (sort === "name_asc") sorted.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    return sorted;
  };

  const saveAddress = (id: string | null, input: AddressInput): DeliveryAddress => {
    const isDefault = input.isDefault ?? (id ? state.addresses.find((a) => a.id === id)?.isDefault ?? false : state.addresses.length === 0);
    if (isDefault) state.addresses = state.addresses.map((a) => ({ ...a, isDefault: false }));
    const saved: DeliveryAddress = { ...input, id: id ?? nextId(), isDefault };
    state.addresses = id ? state.addresses.map((a) => (a.id === id ? saved : a)) : [...state.addresses, saved];
    return saved;
  };

  const createOrder = (input: CreateOrderInput): Order => {
    const existing = idempotency.get(input.idempotencyKey);
    if (existing) return state.orders.find((o) => o.id === existing)!;
    const address = state.addresses.find((a) => a.id === input.addressId);
    if (!address) throw notFound("Adres bulunamadı.");
    if (input.paymentMethod === "card" && !state.cardAvailable) throw new ApiError(400, "Kart ile ödeme şu anda kullanılamıyor.");
    const cart = buildCart();
    if (cart.items.length === 0) throw conflict("Sepetin boş.", "CART_CHANGED");
    if (!cart.canCheckout) throw conflict("Sepetindeki bazı ürünlerin stoğu değişti.", "OUT_OF_STOCK");
    if (round2(input.expectedTotal) !== cart.totals.total) throw conflict("Sepet tutarı değişti. Lütfen güncel tutarı kontrol et.", "PRICE_CHANGED");

    for (const line of cart.items) products.find((p) => p.id === line.productId)!.stock -= line.quantity;
    const id = nextId();
    const { id: _addressId, isDefault: _isDefault, ...deliveryAddress } = address;
    const order: Order = {
      id,
      orderNumber: `MB-20261029-${id}`,
      createdAt: "2026-10-29T12:00:00Z",
      status: "received",
      paymentStatus: "pending",
      paymentMethod: input.paymentMethod,
      total: cart.totals.total,
      itemCount: cart.totals.itemCount,
      itemNames: cart.items.map((i) => i.name),
      items: cart.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        brand: i.brand,
        image: i.image,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        originalUnitPrice: i.unitOriginalPrice,
        lineTotal: i.lineTotal,
        variantLabel: i.variantLabel,
      })),
      deliveryAddress,
      subtotal: cart.totals.subtotal,
      discount: cart.totals.discount,
      shippingCost: cart.totals.shippingCost,
      history: [{ status: "received", paymentStatus: "pending", note: null, createdAt: "2026-10-29T12:00:00Z" }],
      canCancel: true,
      cancelReason: null,
      bankTransfer:
        input.paymentMethod === "bank_transfer" ? { iban: "TR00 0000 0000 0000 0000 0000 00", accountName: "MB Fit Test", bankName: "Test Bankası", reference: `MB-20261029-${id}` } : null,
    };
    state.orders = [order, ...state.orders];
    state.cartRows = [];
    idempotency.set(input.idempotencyKey, id);
    return order;
  };

  // Gercek ag gibi her yanit bir sonraki mikro gorevde doner.
  const later = <T,>(fn: () => T): Promise<T> => Promise.resolve().then(fn);

  state.services = {
    catalog: {
      getCategories: () =>
        later(() =>
          categories.map((c) => ({ ...c, productCount: products.filter((p) => p.isActive && inCategory(p, c.id)).length })),
        ),
      getCampaigns: () =>
        later((): Campaign[] => {
          const items = products.filter((p) => p.isActive && p.campaignIds.includes("1"));
          return [
            {
              id: "1",
              title: "Sonbahar İndirimi",
              description: "Seçili ürünlerde indirim",
              image: null,
              discountPercentage: Math.max(...items.map((p) => p.discountPercentage)),
              productCount: items.length,
              featuredProduct: items[0] ? summary(items[0]) : null,
              tint: "#FFE5D0",
            },
          ];
        }),
      getBrands: (categoryId) =>
        later(() => [...new Set(products.filter((p) => p.isActive && (!categoryId || inCategory(p, categoryId))).map((p) => p.brand))].sort()),
      getProducts: (filters, pageNo, size) => later(() => page(filterProducts(filters).map(summary), pageNo, size)),
      getProduct: (id) =>
        later(() => {
          const p = find(id);
          if (!p) throw notFound("Ürün bulunamadı.");
          const { isActive: _a, isFeatured: _f, createdAt: _c, campaignIds: _ids, ...rest } = p;
          return { ...rest, categoryName: categories.find((c) => c.id === p.categoryId)?.name ?? null };
        }),
    },
    cart: {
      get: () => later(buildCart),
      add: ({ productId, quantity, selectedVariant }) =>
        later(() => {
          const p = find(productId);
          if (!p) throw notFound("Ürün bulunamadı.");
          for (const g of p.variants) {
            const option = g.options.find((o) => o.id === selectedVariant[g.id]);
            if (!option) throw new ApiError(400, `${g.label} seçin.`);
            if (option.inStock === false) throw conflict("Seçilen seçenek stokta yok.", "OUT_OF_STOCK");
          }
          const key = JSON.stringify(Object.entries(selectedVariant).sort());
          const row = state.cartRows.find((r) => r.productId === productId && JSON.stringify(Object.entries(r.selectedVariant).sort()) === key);
          const nextQty = (row?.quantity ?? 0) + quantity;
          if (nextQty > Math.min(p.stock, MAX_PER_LINE)) throw conflict(p.stock === 0 ? "Ürün stokta yok." : "Stok yetersiz.", "OUT_OF_STOCK");
          if (row) row.quantity = nextQty;
          else state.cartRows.push({ id: nextId(), productId, selectedVariant, quantity });
          return buildCart();
        }),
      setQuantity: (lineId, quantity) =>
        later(() => {
          const row = state.cartRows.find((r) => r.id === lineId);
          if (!row) throw notFound("Sepet satırı bulunamadı.");
          if (quantity <= 0) state.cartRows = state.cartRows.filter((r) => r.id !== lineId);
          else {
            const p = products.find((x) => x.id === row.productId)!;
            if (quantity > Math.min(p.stock, MAX_PER_LINE)) throw conflict("Stok yetersiz.", "OUT_OF_STOCK");
            row.quantity = quantity;
          }
          return buildCart();
        }),
      remove: (lineId) =>
        later(() => {
          state.cartRows = state.cartRows.filter((r) => r.id !== lineId);
          return buildCart();
        }),
    },
    favorites: {
      list: () => later(() => state.favorites.map((id) => find(id)).filter((p): p is FakeProduct => Boolean(p)).map(summary)),
      add: (productId) =>
        later(() => {
          if (!find(productId)) throw notFound("Ürün bulunamadı.");
          if (!state.favorites.includes(productId)) state.favorites = [...state.favorites, productId];
        }),
      remove: (productId) =>
        later(() => {
          state.favorites = state.favorites.filter((id) => id !== productId);
        }),
    },
    addresses: {
      list: () => later(() => [...state.addresses]),
      create: (input) => later(() => saveAddress(null, input)),
      update: (id, input) =>
        later(() => {
          if (!state.addresses.some((a) => a.id === id)) throw notFound("Adres bulunamadı.");
          return saveAddress(id, input);
        }),
      remove: (id) =>
        later(() => {
          state.addresses = state.addresses.filter((a) => a.id !== id);
        }),
    },
    orders: {
      getCheckoutOptions: () =>
        later(() => ({
          freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
          shippingCost: SHIPPING_COST,
          paymentMethods: [
            { method: "cash_on_delivery" as const, label: "Kapıda ödeme", description: "Teslimatta öde", available: true, unavailableReason: null },
            { method: "bank_transfer" as const, label: "Havale / EFT", description: "Banka hesabına gönder", available: true, unavailableReason: null },
            {
              method: "card" as const,
              label: "Kart ile ödeme",
              description: "Kredi / banka kartı",
              available: state.cardAvailable,
              unavailableReason: state.cardAvailable ? null : "Kart ile ödeme yakında.",
            },
          ],
        })),
      create: (input) => later(() => createOrder(input)),
      list: (pageNo, size) => later(() => page(state.orders.map(toListItem), pageNo, size)),
      get: (id) =>
        later(() => {
          const order = state.orders.find((o) => o.id === id);
          if (!order) throw notFound("Sipariş bulunamadı.");
          return order;
        }),
      cancel: (id, reason) =>
        later(() => {
          const order = state.orders.find((o) => o.id === id);
          if (!order) throw notFound("Sipariş bulunamadı.");
          if (order.status !== "received") throw conflict("Bu sipariş artık iptal edilemez.", "INVALID_STATUS");
          for (const item of order.items) {
            const p = products.find((x) => x.id === item.productId);
            if (p) p.stock += item.quantity;
          }
          const updated: Order = {
            ...order,
            status: "cancelled",
            paymentStatus: "cancelled",
            canCancel: false,
            cancelReason: reason ?? null,
            bankTransfer: null,
            history: [...order.history, { status: "cancelled", paymentStatus: "cancelled", note: reason ?? null, createdAt: "2026-10-29T13:00:00Z" }],
          };
          state.orders = state.orders.map((o) => (o.id === id ? updated : o));
          return updated;
        }),
    },
  };
  return state;
}
