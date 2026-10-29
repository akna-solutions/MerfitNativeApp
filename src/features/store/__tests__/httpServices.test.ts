import { ApiError, apiRequest } from "../../../services/api/client";
import { StoreCartDto, StoreOrderDto } from "../../../services/api/store";
import { createHttpStoreServices } from "../services/http";

jest.mock("../../../services/api/client", () => {
  const actual = jest.requireActual("../../../services/api/client");
  return { ...actual, apiRequest: jest.fn() };
});

const request = apiRequest as jest.MockedFunction<typeof apiRequest>;
const services = createHttpStoreServices();

const cartDto: StoreCartDto = {
  items: [
    {
      id: 7,
      productId: 101,
      categoryId: 1,
      name: "Whey",
      brand: "PureLab",
      sku: "WHEY-1",
      imageUrl: null,
      selectedVariant: { size: "m" },
      variantLabel: "M",
      quantity: 2,
      maxQuantity: 10,
      unitPrice: 100,
      unitOriginalPrice: 120,
      lineTotal: 200,
      lineOriginalTotal: 240,
      isAvailable: true,
      unavailableReason: null,
    },
  ],
  totals: { itemCount: 2, subtotal: 240, discount: 40, shippingCost: 49.9, total: 249.9, remainingForFreeShipping: 300, freeShippingThreshold: 500, currency: "TRY" },
  canCheckout: true,
};

const orderDto: StoreOrderDto = {
  id: 55,
  orderNumber: "MB-20261029-000055",
  createdAt: "2026-10-29T12:00:00Z",
  status: "received",
  paymentStatus: "pending",
  paymentMethod: "bank_transfer",
  total: 249.9,
  currency: "TRY",
  itemCount: 2,
  itemNames: ["Whey"],
  subtotal: 240,
  discount: 40,
  shippingCost: 49.9,
  shippingAddress: { title: "Ev", recipientName: "Ayşe", phoneNumber: "05321234567", city: "İstanbul", district: "Kadıköy", addressLine: "Adres", postalCode: null },
  items: [{ productId: null, name: "Whey", brand: "PureLab", sku: "WHEY-1", imageUrl: null, variantLabel: "M", quantity: 2, unitPrice: 100, unitOriginalPrice: 120, discountAmount: 40, lineTotal: 200 }],
  history: [],
  canCancel: true,
  cancelledAt: null,
  cancelReason: null,
  bankTransfer: { iban: "TR00", accountName: "MB Fit", bankName: null, reference: "MB-20261029-000055" },
};

beforeEach(() => request.mockReset());

describe("MB Shop HTTP servisleri", () => {
  it("urun filtrelerini sunucu sorgusuna cevirir; gecersiz id'leri gondermez", async () => {
    request.mockResolvedValue({ items: [], page: 2, pageSize: 20, totalCount: 0, totalPages: 0, hasNextPage: false });
    await services.catalog.getProducts(
      { query: "  whey ", categoryId: "3", campaignId: "abc", collection: "discounted", brands: ["A", "B"], inStockOnly: true, sort: "price_asc", excludeId: "9" },
      2,
      20,
    );
    expect(request).toHaveBeenCalledWith("/api/store/products", {
      query: expect.objectContaining({ page: 2, pageSize: 20, q: "whey", categoryId: 3, campaignId: undefined, collection: "discounted", brands: "A,B", inStockOnly: true, sort: "price_asc", excludeId: 9 }),
      signal: undefined,
    });
  });

  it("sepete eklerken fiyat gondermez; yanit sunucu toplamlariyla eslenir", async () => {
    request.mockResolvedValue(cartDto);
    const cart = await services.cart.add({ productId: "101", quantity: 2, selectedVariant: { size: "m" } });
    expect(request).toHaveBeenCalledWith("/api/store/cart/items", { method: "POST", body: { productId: 101, quantity: 2, selectedVariant: { size: "m" } } });
    const body = (request.mock.calls[0][1] as { body: object }).body;
    expect(Object.keys(body)).not.toContain("price");
    expect(cart.items[0]).toMatchObject({ id: "7", productId: "101", lineTotal: 200, unitOriginalPrice: 120 });
    expect(cart.totals).toMatchObject({ total: 249.9, shippingCost: 49.9, discount: 40 });
  });

  it("siparisi adres id, odeme yontemi, idempotency anahtari ve beklenen tutarla olusturur", async () => {
    request.mockResolvedValue(orderDto);
    const order = await services.orders.create({ addressId: "4", paymentMethod: "bank_transfer", idempotencyKey: "key-1", expectedTotal: 249.9 });
    expect(request).toHaveBeenCalledWith("/api/store/orders", {
      method: "POST",
      body: { addressId: 4, paymentMethod: "bank_transfer", idempotencyKey: "key-1", expectedTotal: 249.9 },
    });
    expect(order).toMatchObject({ id: "55", orderNumber: "MB-20261029-000055", paymentStatus: "pending", canCancel: true });
    expect(order.deliveryAddress).toEqual({ title: "Ev", fullName: "Ayşe", phone: "05321234567", city: "İstanbul", district: "Kadıköy", address: "Adres" });
    expect(order.items[0].productId).toBeNull();
    expect(order.bankTransfer?.iban).toBe("TR00");
  });

  it("iptal ve favori uclarini dogru yontemle cagirir", async () => {
    request.mockResolvedValue(orderDto);
    await services.orders.cancel("55", "Vazgeçtim");
    expect(request).toHaveBeenCalledWith("/api/store/orders/55/cancel", { method: "POST", body: { reason: "Vazgeçtim" } });
    request.mockResolvedValue(undefined);
    await services.favorites.add("101");
    expect(request).toHaveBeenLastCalledWith("/api/store/favorites/101", { method: "PUT" });
  });

  it("adres formunu sunucu alanlarina cevirir", async () => {
    request.mockResolvedValue({ id: 9, title: "İş", recipientName: "Ali", phoneNumber: "0555", city: "Ankara", district: "Çankaya", addressLine: "Cadde", postalCode: null, isDefault: false });
    const saved = await services.addresses.create({ title: " İş ", fullName: "Ali", phone: "0555", city: "Ankara", district: "Çankaya", address: "Cadde" });
    expect(request).toHaveBeenCalledWith("/api/store/addresses", {
      method: "POST",
      body: { title: "İş", recipientName: "Ali", phoneNumber: "0555", city: "Ankara", district: "Çankaya", addressLine: "Cadde", postalCode: null, isDefault: false },
    });
    expect(saved).toMatchObject({ id: "9", fullName: "Ali", isDefault: false });
  });

  it("sayisal olmayan id'de istek atmadan 404 verir", async () => {
    await expect(services.catalog.getProduct("p-001")).rejects.toMatchObject({ status: 404 });
    await expect(services.orders.get("abc")).rejects.toBeInstanceOf(ApiError);
    expect(request).not.toHaveBeenCalled();
  });
});
