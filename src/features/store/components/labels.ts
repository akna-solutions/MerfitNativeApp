import { OrderStatus, PaymentMethod, PaymentStatus } from "../types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Sipariş Alındı",
  preparing: "Hazırlanıyor",
  shipped: "Kargoya Verildi",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

/** Ilerleme cubugundaki adimlar (iptal ayri gosterilir). */
export const ORDER_STATUS_STEPS: OrderStatus[] = ["received", "preparing", "shipped", "delivered"];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash_on_delivery: "Kapıda ödeme",
  bank_transfer: "Havale / EFT",
  card: "Kart ile ödeme",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Ödeme bekleniyor",
  paid: "Ödendi",
  failed: "Ödeme alınamadı",
  refund_pending: "İade bekleniyor",
  refunded: "İade edildi",
  cancelled: "Ödeme iptal edildi",
};

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}
