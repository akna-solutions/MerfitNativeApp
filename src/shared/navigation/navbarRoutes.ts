import type { Href } from "expo-router";

import type { NavTab, NavVariant } from "../../app/pages/dashboard/components/BottomNavigation";

const href = (value: string) => value as unknown as Href;

/** Navbar'da secilen menunun gidecegi sekme rotasi; Store menuleri de birer sekmedir, navbar sabit kalir. */
export function navbarRoute(tab: NavTab, variant: NavVariant): Href {
  switch (tab) {
    case "home":
      return href("/pages/dashboard");
    case "workouts":
      return href("/pages/workouts");
    case "nutrition":
      return href("/pages/nutrition");
    case "profile":
      // MB Shop tarafindaki Profilim ayri bir sekmedir; boylece MB Shop'tan cikilmaz.
      return href(variant === "store" ? "/pages/store-profile" : "/pages/profile");
    case "store":
      return href("/pages/store");
    case "categories":
      return href("/pages/store-categories");
    case "orders":
      return href("/pages/store-orders");
  }
}

/** Store gorunumunde sagdaki yuvarlak buton ("home") uygulamaya, ana gorunumde ("store") Store'a gider. */
export function circleTab(variant: NavVariant): NavTab {
  return variant === "store" ? "home" : "store";
}
