import { circleTab, navbarRoute } from "../navbarRoutes";

describe("navbarRoute", () => {
  it("ana ve Store menulerini sekme rotalarina esler", () => {
    expect(navbarRoute("home", "main")).toBe("/pages/dashboard");
    expect(navbarRoute("profile", "main")).toBe("/pages/profile");
    expect(navbarRoute("profile", "store")).toBe("/pages/store-profile");
    expect(navbarRoute("store", "main")).toBe("/pages/store");
    expect(navbarRoute("orders", "store")).toBe("/pages/store-orders");
    expect(navbarRoute("categories", "store")).toBe("/pages/store-categories");
  });

  it("yuvarlak buton ana gorunumde Store'a, Store gorunumunde uygulamaya gider", () => {
    expect(circleTab("main")).toBe("store");
    expect(circleTab("store")).toBe("home");
  });
});
