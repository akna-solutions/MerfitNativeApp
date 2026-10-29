import { circleTab, navbarRoute } from "../navbarRoutes";

describe("navbarRoute", () => {
  it("ana menuleri tab rotalarina, Store menulerini store rotalarina esler", () => {
    expect(navbarRoute("home", "main")).toBe("/pages/dashboard");
    expect(navbarRoute("profile", "store")).toBe("/pages/profile");
    expect(navbarRoute("store", "main")).toBe("/pages/store");
    expect(navbarRoute("orders", "store")).toBe("/pages/store/orders");
    expect(navbarRoute("categories", "store")).toEqual({ pathname: "/pages/store/products", params: { title: "Tüm Ürünler" } });
  });

  it("yuvarlak buton ana gorunumde Store'a, Store gorunumunde uygulamaya gider", () => {
    expect(circleTab("main")).toBe("store");
    expect(circleTab("store")).toBe("home");
  });
});
