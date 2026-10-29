import { createDummyStoreServices } from "../services/dummy";
import { INITIAL_ADDRESSES } from "../data/addresses";

describe("dummy store servisleri", () => {
  it("ayni urun ve varyanti tekrar eklenince satiri birlestirir, farkli varyanti ayri satir yapar", async () => {
    const { cart } = createDummyStoreServices();
    await cart.addItem({ productId: "p-005", quantity: 1, selectedVariant: { size: "m", color: "black" } });
    const merged = await cart.addItem({ productId: "p-005", quantity: 2, selectedVariant: { color: "black", size: "m" } });
    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(3);
    const split = await cart.addItem({ productId: "p-005", quantity: 1, selectedVariant: { size: "l", color: "black" } });
    expect(split).toHaveLength(2);
  });

  it("eksik varyant, stoksuz urun ve bilinmeyen urunu sepete almaz", async () => {
    const { cart } = createDummyStoreServices();
    await expect(cart.addItem({ productId: "p-005", quantity: 1, selectedVariant: {} })).rejects.toThrow();
    await expect(cart.addItem({ productId: "p-003", quantity: 1, selectedVariant: {} })).rejects.toThrow(/stok/i);
    await expect(cart.addItem({ productId: "yok", quantity: 1, selectedVariant: {} })).rejects.toThrow();
    expect(await cart.getItems()).toEqual([]);
  });

  it("adedi stokla sinirlar, 0'a dusurulen satiri kaldirir", async () => {
    const { cart } = createDummyStoreServices();
    await cart.addItem({ productId: "p-011", quantity: 1, selectedVariant: {} }); // stok 9
    expect((await cart.setQuantity("p-011", {}, 50))[0].quantity).toBe(9);
    expect(await cart.setQuantity("p-011", {}, 0)).toEqual([]);
  });

  it("favoriyi ekler ve cikarir", async () => {
    const { favorites } = createDummyStoreServices();
    expect(await favorites.toggle("p-001")).toEqual(["p-001"]);
    expect(await favorites.toggle("p-002")).toEqual(["p-002", "p-001"]);
    expect(await favorites.toggle("p-001")).toEqual(["p-002"]);
  });

  it("siparis olusturur: toplamlar sepetle ayni, durum 'Sipariş Alındı', liste basinda", async () => {
    const s = createDummyStoreServices();
    await s.cart.addItem({ productId: "p-005", quantity: 2, selectedVariant: { size: "m", color: "black" } });
    await s.cart.addItem({ productId: "p-014", quantity: 1, selectedVariant: { color: "black" } });
    const before = (await s.orders.getOrders()).length;
    const order = await s.orders.createOrder({ items: await s.cart.getItems(), deliveryAddress: INITIAL_ADDRESSES[0], paymentMethod: "cash_on_delivery" });
    expect(order.id).toMatch(/^MBF-\d{6}-\d+$/);
    expect(order.status).toBe("received");
    expect(order.subtotal).toBe(929.7);
    expect(order.discount).toBe(200);
    expect(order.total).toBe(729.7);
    expect(order.items[0].variantLabel).toBe("M · Siyah");
    const orders = await s.orders.getOrders();
    expect(orders).toHaveLength(before + 1);
    expect(orders[0].id).toBe(order.id);
    expect((await s.orders.getOrder(order.id))?.id).toBe(order.id);
    expect(await s.orders.getOrder("yok")).toBeNull();
  });

  it("bos sepetle siparis olusturmaz; siparis numaralari benzersizdir", async () => {
    const s = createDummyStoreServices();
    await expect(s.orders.createOrder({ items: [], deliveryAddress: INITIAL_ADDRESSES[0], paymentMethod: "bank_transfer" })).rejects.toThrow();
    await s.cart.addItem({ productId: "p-014", quantity: 1, selectedVariant: { color: "black" } });
    const items = await s.cart.getItems();
    const a = await s.orders.createOrder({ items, deliveryAddress: INITIAL_ADDRESSES[0], paymentMethod: "bank_transfer" });
    const b = await s.orders.createOrder({ items, deliveryAddress: INITIAL_ADDRESSES[0], paymentMethod: "bank_transfer" });
    expect(a.id).not.toBe(b.id);
  });

  it("her fabrika cagrisi izole durum uretir", async () => {
    const a = createDummyStoreServices();
    const b = createDummyStoreServices();
    await a.favorites.toggle("p-001");
    expect(await b.favorites.getFavoriteIds()).toEqual([]);
  });

  it("adres ekler, gunceller ve siler", async () => {
    const { addresses } = createDummyStoreServices();
    const start = (await addresses.getAddresses()).length;
    const added = await addresses.saveAddress({ title: "Yazlık", fullName: "Reis Demir", phone: "5321234567", city: "Muğla", district: "Bodrum", address: "Deneme Mah. 1. Sok. No 3" });
    expect(added).toHaveLength(start + 1);
    const id = added[added.length - 1].id;
    const updated = await addresses.saveAddress({ ...added[added.length - 1], title: "Yazlık Ev" });
    expect(updated.find((a) => a.id === id)?.title).toBe("Yazlık Ev");
    expect(await addresses.removeAddress(id)).toHaveLength(start);
  });
});
