import {
    Product,
    SubscriptionPlan,
    SubscriptionService,
    SubscriptionStatus,
} from "./SubscriptionService";

const MOCK_PRODUCTS: Product[] = [
  { plan: "monthly", price: "9.99", currency: "USD", period: "per month" },
  {
    plan: "yearly",
    price: "79.99",
    currency: "USD",
    period: "per year",
    badge: "SAVE 20%",
  },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// DO NOT USE FAKE PAYMENT: burada gerçek bir ödeme akışı yok, sadece
// UI'ın purchase state'lerini (loading/success/error) test edebilmesi
// için mock bir gecikme simüle ediliyor.
export class MockSubscriptionService implements SubscriptionService {
  private membership: "FREE" | "PLUS" = "FREE";

  async getProducts(): Promise<Product[]> {
    await delay(200);
    return MOCK_PRODUCTS;
  }

  async purchasePlus(_plan: SubscriptionPlan): Promise<void> {
    // TODO: App Store / Google Play satın alma akışı buraya bağlanacak.
    await delay(1200);
    this.membership = "PLUS";
  }

  async restorePurchases(): Promise<SubscriptionStatus> {
    // TODO: Gerçek store'dan mevcut abonelikleri sorgula.
    await delay(800);
    return { membership: this.membership };
  }

  async getCurrentSubscription(): Promise<SubscriptionStatus> {
    await delay(150);
    return { membership: this.membership };
  }
}

export const subscriptionService: SubscriptionService =
  new MockSubscriptionService();
