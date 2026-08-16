export type SubscriptionPlan = "monthly" | "yearly";

export type Product = {
  plan: SubscriptionPlan;
  price: string; // mock - gerçek fiyat App Store/Google Play'den gelecek
  currency: string;
  period: string; // "per month" | "per year"
  badge?: string; // ör. "SAVE 20%"
};

export type SubscriptionStatus = {
  membership: "FREE" | "PLUS";
  renewsAt?: string;
};

// UI ve premium gating mantığı SADECE bu arayüze bağımlı olmalı.
// İleride RevenueCat / native StoreKit / Google Play Billing eklenince
// tek yapılacak şey bu arayüzü implemente eden yeni bir servis yazıp
// subscriptionService export'unu değiştirmek.
export interface SubscriptionService {
  getProducts(): Promise<Product[]>;
  purchasePlus(plan: SubscriptionPlan): Promise<void>;
  restorePurchases(): Promise<SubscriptionStatus>;
  getCurrentSubscription(): Promise<SubscriptionStatus>;
}
