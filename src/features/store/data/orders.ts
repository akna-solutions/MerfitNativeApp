import { Order, OrderItem } from "../types";
import { PRODUCTS_BY_ID } from "./products";
import { INITIAL_ADDRESSES } from "./addresses";
import { round2, shippingFor } from "../utils/pricing";

function line(productId: string, quantity: number, variantLabel = ""): OrderItem {
  const p = PRODUCTS_BY_ID.get(productId);
  if (!p) throw new Error(`Dummy siparis verisi: bilinmeyen urun ${productId}`);
  return { productId, name: p.name, brand: p.brand, image: p.images[0] ?? null, quantity, unitPrice: p.price, originalUnitPrice: p.originalPrice, variantLabel };
}

function buildOrder(id: string, createdAt: string, items: OrderItem[], status: Order["status"], estimatedDelivery: string, paymentMethod: Order["paymentMethod"]): Order {
  const subtotal = round2(items.reduce((s, i) => s + i.originalUnitPrice * i.quantity, 0));
  const paid = round2(items.reduce((s, i) => s + i.unitPrice * i.quantity, 0));
  const shippingCost = shippingFor(paid);
  return {
    id, createdAt, items, status, estimatedDelivery, paymentMethod,
    deliveryAddress: INITIAL_ADDRESSES[0],
    subtotal, discount: round2(subtotal - paid), shippingCost, total: round2(paid + shippingCost),
  };
}

// Durumlar yalnizca demo verisidir; gercek kargo takibi yapilmaz.
export const INITIAL_ORDERS: Order[] = [
  buildOrder("MBF-261027-1042", "2026-10-27T09:14:00.000Z", [line("p-001", 1, "2 kg · Çikolata"), line("p-014", 1, "Siyah")], "received", "3-5 iş günü içinde (demo)", "card_simulation"),
  buildOrder("MBF-261024-0877", "2026-10-24T16:40:00.000Z", [line("p-005", 2, "M · Siyah"), line("p-006", 1, "L · Lacivert")], "preparing", "2-4 iş günü içinde (demo)", "cash_on_delivery"),
  buildOrder("MBF-261019-0516", "2026-10-19T12:05:00.000Z", [line("p-018", 1, "Mavi")], "shipped", "Yarın teslim edilmesi bekleniyor (demo)", "bank_transfer"),
  buildOrder("MBF-261008-0231", "2026-10-08T18:22:00.000Z", [line("p-009", 1, "2 x 5 kg"), line("p-010", 1)], "delivered", "Teslim edildi (demo)", "card_simulation"),
];

