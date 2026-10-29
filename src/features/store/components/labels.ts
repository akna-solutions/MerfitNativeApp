import { OrderStatus, PaymentMethod } from "../types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Sipariş Alındı",
  preparing: "Hazırlanıyor",
  shipped: "Kargoya Verildi",
  delivered: "Teslim Edildi",
};

export const ORDER_STATUS_STEPS: OrderStatus[] = ["received", "preparing", "shipped", "delivered"];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash_on_delivery: "Kapıda ödeme (demo)",
  bank_transfer: "Havale/EFT (demo)",
  card_simulation: "Kart ile ödeme (simülasyon)",
};

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}
