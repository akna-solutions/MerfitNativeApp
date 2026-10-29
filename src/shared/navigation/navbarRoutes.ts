import type { Href } from "expo-router";

import type { NavTab, NavVariant } from "../../app/pages/dashboard/components/BottomNavigation";

const href = (value: string) => value as unknown as Href;

/** Navbar'da secilen menunun gidecegi rota; Store menuleri ("categories", "orders") store rotalarina gider. */
export function navbarRoute(tab: NavTab, variant: NavVariant): Href {
  switch (tab) {
    case "home":
      return href("/pages/dashboard");
    case "workouts":
      return href("/pages/workouts");
    case "nutrition":
      return href("/pages/nutrition");
    case "profile":
      return href("/pages/profile");
    case "store":
      return href("/pages/store");
    case "categories":
      return { pathname: "/pages/store/products", params: { title: "Tüm Ürünler" } } as unknown as Href;
    case "orders":
      return href("/pages/store/orders");
  }
}

/** Store gorunumunde sagdaki yuvarlak buton ("home") uygulamaya, ana gorunumde ("store") Store'a gider. */
export function circleTab(variant: NavVariant): NavTab {
  return variant === "store" ? "home" : "store";
}
