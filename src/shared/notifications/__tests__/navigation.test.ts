import { inboxRouteFor, notificationAppOf, resolveNotificationRoute } from "../navigation";

describe("notification navigation", () => {
  it("routes MB FIT screens as before", () => {
    expect(resolveNotificationRoute({ screen: "nutrition" })).toBe("/pages/nutrition");
    expect(resolveNotificationRoute({ screen: "https://evil.example" })).toBeNull();
    expect(resolveNotificationRoute({ screen: "__proto__" })).toBeNull();
  });

  it("routes MB Shop screens, validating ids", () => {
    expect(resolveNotificationRoute({ screen: "store" })).toBe("/pages/store");
    expect(resolveNotificationRoute({ screen: "storeNotifications" })).toBe("/pages/store/notifications");
    expect(resolveNotificationRoute({ screen: "storeOrder", orderId: "42" })).toBe("/pages/store/orders/42");
    expect(resolveNotificationRoute({ screen: "storeProduct", productId: 7 })).toBe("/pages/store/product/7");
    // Gecersiz kimlik baska bir rotaya kacamaz; liste ekranina duser.
    expect(resolveNotificationRoute({ screen: "storeOrder", orderId: "../../profile" })).toBe("/pages/store/orders");
    expect(resolveNotificationRoute({ screen: "storeProduct" })).toBe("/pages/store");
  });

  it("opens the matching inbox when a notification has no target", () => {
    expect(notificationAppOf({ app: "mbshop" })).toBe("mbshop");
    expect(notificationAppOf({ type: "StoreOrderUpdate" })).toBe("mbshop");
    expect(notificationAppOf({ type: "WorkoutReminder" })).toBe("mbfit");
    expect(notificationAppOf(null)).toBe("mbfit");
    expect(inboxRouteFor("mbshop")).toBe("/pages/store/notifications");
    expect(inboxRouteFor("mbfit")).toBe("/pages/notifications");
  });
});
