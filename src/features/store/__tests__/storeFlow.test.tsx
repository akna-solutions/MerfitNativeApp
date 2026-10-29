import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ReactNode } from "react";
import { Alert } from "react-native";

import { ApiError, NetworkError } from "../../../services/api/client";
import { mockThemeValue } from "../../../test/mockTheme";
import { createFakeStore, FakeStore } from "../../../test/storeFakes";
import { StoreProvider, useStore } from "../state/StoreContext";
import { AddressesScreen } from "../screens/AddressesScreen";
import { CartScreen } from "../screens/CartScreen";
import { CategoriesScreen } from "../screens/CategoriesScreen";
import { CheckoutScreen } from "../screens/CheckoutScreen";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { OrderDetailScreen } from "../screens/OrderDetailScreen";
import { OrderSuccessScreen } from "../screens/OrderSuccessScreen";
import { OrdersScreen } from "../screens/OrdersScreen";
import { ProductDetailScreen } from "../screens/ProductDetailScreen";
import { ProductListScreen } from "../screens/ProductListScreen";
import { StoreHomeScreen } from "../screens/StoreHomeScreen";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: jest.fn(() => true) };
let mockParams: Record<string, string> = {};
const mockAuth = { status: "signedIn", sessionVersion: 1, forceSignOut: jest.fn() };

jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (cb: () => void | (() => void)) => React.useEffect(cb, [cb]),
  };
});
jest.mock("../../../shared/auth/AuthContext", () => ({ useAuth: () => mockAuth }));
jest.mock("../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-image", () => {
  const { View } = jest.requireActual("react-native");
  return { Image: (props: object) => <View {...props} /> };
});
jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native");
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});

const probe: { store: ReturnType<typeof useStore> | null } = { store: null };
function Probe() {
  probe.store = useStore();
  return null;
}

async function renderWithStore(ui: ReactNode, fake: FakeStore = createFakeStore()) {
  const utils = await render(
    <StoreProvider services={fake.services}>
      <Probe />
      {ui}
    </StoreProvider>,
  );
  await waitFor(() => expect(probe.store?.isLoading).toBe(false));
  return { ...utils, fake };
}

const store = () => {
  if (!probe.store) throw new Error("store yok");
  return probe.store;
};

const text = (testID: string) => {
  const children = screen.getByTestId(testID).props.children;
  return Array.isArray(children) ? children.join("") : String(children);
};

const pressNext = () =>
  act(async () => {
    await fireEvent.press(screen.getByTestId("checkout-next"));
  });

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockAuth.status = "signedIn";
  probe.store = null;
});

describe("Oturum ve yukleme", () => {
  it("oturum yokken sunucuya istek atmaz", async () => {
    mockAuth.status = "signedOut";
    const fake = createFakeStore();
    const spy = jest.spyOn(fake.services.catalog, "getCategories");
    await render(
      <StoreProvider services={fake.services}>
        <Probe />
      </StoreProvider>,
    );
    expect(spy).not.toHaveBeenCalled();
    expect(store().categories).toEqual([]);
  });

  it("sunucuya ulasilamazsa dummy veri gostermez; hata ve tekrar dene gosterir", async () => {
    const fake = createFakeStore();
    const original = fake.services.catalog.getCategories;
    fake.services.catalog.getCategories = jest.fn().mockRejectedValueOnce(new NetworkError("http://10.0.0.1/api")).mockImplementation(original);
    await render(
      <StoreProvider services={fake.services}>
        <Probe />
        <StoreHomeScreen />
      </StoreProvider>,
    );
    expect(await screen.findByTestId("store-error")).toBeTruthy();
    expect(screen.queryByTestId(/^product-card-/)).toBeNull();
    // Ag hatasi mesaji sunucu adresini kullaniciya gostermez.
    expect(screen.queryByText(/10\.0\.0\.1/)).toBeNull();
    await fireEvent.press(screen.getByText("Tekrar dene"));
    await waitFor(() => expect(screen.queryByTestId("store-error")).toBeNull());
    expect(await screen.findByTestId("campaign-1")).toBeTruthy();
  });

  it("401 yaniti oturumu kapatir", async () => {
    const fake = createFakeStore();
    fake.services.cart.get = jest.fn().mockRejectedValue(new ApiError(401, "Oturum süresi doldu"));
    await render(
      <StoreProvider services={fake.services}>
        <Probe />
      </StoreProvider>,
    );
    await waitFor(() => expect(mockAuth.forceSignOut).toHaveBeenCalled());
  });
});

describe("Kategoriler ve ana sayfa", () => {
  it("yalnizca ust kategorileri sunucunun urun sayisiyla listeler (alt kategori urunleri dahil)", async () => {
    await renderWithStore(<CategoriesScreen />);
    expect(screen.getByTestId("category-row-1")).toBeTruthy();
    expect(screen.queryByTestId("category-row-4")).toBeNull();
    // Protein: 101, 102, 103 + alt kategori Protein Bar (106)
    expect(screen.getByLabelText("Protein, 4 ürün")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("category-row-2"));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/pages/store/products", params: { categoryId: "2", title: "Giyim" } });
  });

  it("kampanyalari ve sunucudan gelen koleksiyonlari gosterir; bos koleksiyon gizlenir", async () => {
    await renderWithStore(<StoreHomeScreen />);
    expect(screen.getByTestId("campaign-1")).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("row-discounted")).toBeTruthy());
    expect(screen.getByTestId("collection-featured")).toBeTruthy();
    expect(screen.getAllByTestId("product-card-104").length).toBeGreaterThan(0);
  });

  it("arama sunucu sorgusuyla calisir ve sonuc yoksa bos durum gosterir", async () => {
    const { fake } = await renderWithStore(<StoreHomeScreen />);
    const spy = jest.spyOn(fake.services.catalog, "getProducts");
    await fireEvent.changeText(screen.getByTestId("store-search"), "kettle");
    await waitFor(() => expect(screen.getByTestId("product-card-105")).toBeTruthy());
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ query: "kettle" }), 1, expect.any(Number), expect.anything());
    expect(screen.queryByTestId("campaign-list")).toBeNull();

    await fireEvent.changeText(screen.getByTestId("store-search"), "olmayan urun");
    await waitFor(() => expect(screen.getByTestId("search-empty")).toBeTruthy());
  });

  it("varyantli urunde hizli ekleme detaya gider, varyantsizda sunucu sepetine ekler; favori sunucuya yazilir", async () => {
    const { fake } = await renderWithStore(<ProductListScreen />);
    await waitFor(() => expect(screen.getByTestId("product-card-104")).toBeTruthy());
    await fireEvent.press(screen.getByTestId("quick-add-104"));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("/pages/store/product/104"));
    expect(fake.cartRows).toHaveLength(0);

    await act(async () => {
      await fireEvent.press(screen.getByTestId("quick-add-105"));
    });
    await waitFor(() => expect(store().cart.totals.itemCount).toBe(1));
    expect(fake.cartRows).toEqual([expect.objectContaining({ productId: "105", quantity: 1 })]);

    await act(async () => {
      await fireEvent.press(screen.getByTestId("favorite-105"));
    });
    await waitFor(() => expect(fake.favorites).toEqual(["105"]));
    expect(store().favoriteIds).toEqual(["105"]);
    await act(async () => {
      await fireEvent.press(screen.getByTestId("favorite-105"));
    });
    await waitFor(() => expect(fake.favorites).toEqual([]));
  });
});

describe("Urun listesi", () => {
  it("kategori filtresini sunucuya iletir ve alt kategori urunlerini de getirir", async () => {
    mockParams = { categoryId: "1" };
    await renderWithStore(<ProductListScreen />);
    await waitFor(() => expect(screen.getByTestId("product-card-101")).toBeTruthy());
    expect(screen.getByTestId("product-card-106")).toBeTruthy();
    expect(screen.queryByTestId("product-card-105")).toBeNull();
  });

  it("sonuc yoksa 'Ürün bulunamadı' gosterir", async () => {
    mockParams = { q: "yokboyleurun" };
    await renderWithStore(<ProductListScreen />);
    await waitFor(() => expect(screen.getByTestId("list-empty")).toBeTruthy());
  });
});

describe("Urun detay", () => {
  it("bulunamayan urunde anlasilir mesaj gosterir", async () => {
    mockParams = { id: "999" };
    await renderWithStore(<ProductDetailScreen />);
    await waitFor(() => expect(screen.getByTestId("product-not-found")).toBeTruthy());
  });

  it("varyant secilmeden eklemeyi engeller; secimle sunucu sepetine urun/varyant/adet gider, fiyat gonderilmez", async () => {
    mockParams = { id: "101" };
    const { fake } = await renderWithStore(<ProductDetailScreen />);
    await waitFor(() => expect(screen.getByTestId("add-to-cart")).toBeTruthy());
    const spy = jest.spyOn(fake.services.cart, "add");

    await act(async () => {
      await fireEvent.press(screen.getByTestId("add-to-cart"));
    });
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByTestId("detail-notice")).toBeTruthy();

    expect(screen.getByTestId("variant-flavor-caramel").props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId("variant-package-2kg"));
    await fireEvent.press(screen.getByTestId("variant-flavor-vanilla"));
    await fireEvent.press(screen.getByTestId("detail-qty-plus"));
    expect(text("detail-total")).toMatch(/2\.800,00/);

    await act(async () => {
      await fireEvent.press(screen.getByTestId("add-to-cart"));
    });
    expect(spy).toHaveBeenCalledWith({ productId: "101", quantity: 2, selectedVariant: { package: "2kg", flavor: "vanilla" } });
    await waitFor(() => expect(store().cart.items).toHaveLength(1));
    expect(store().cart.items[0]).toMatchObject({ quantity: 2, unitPrice: 1400, variantLabel: "2 kg · Vanilya" });

    // Ayni urun + varyant sunucuda birlesir.
    await act(async () => {
      await fireEvent.press(screen.getByTestId("add-to-cart"));
    });
    await waitFor(() => expect(store().cart.items[0].quantity).toBe(4));
    expect(store().cart.items).toHaveLength(1);
  });

  it("stoksuz urunde satin almayi kapatir", async () => {
    mockParams = { id: "103" };
    await renderWithStore(<ProductDetailScreen />);
    await waitFor(() => expect(screen.getByTestId("add-to-cart")).toBeTruthy());
    expect(screen.getByTestId("add-to-cart").props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId("buy-now").props.accessibilityState.disabled).toBe(true);
  });

  it("stok yetmezse sunucunun 409 mesajini gosterir", async () => {
    mockParams = { id: "102" };
    const fake = createFakeStore({ cart: [{ productId: "102", quantity: 5, selectedVariant: {} }] });
    await renderWithStore(<ProductDetailScreen />, fake);
    await waitFor(() => expect(screen.getByTestId("add-to-cart")).toBeTruthy());
    await act(async () => {
      await fireEvent.press(screen.getByTestId("add-to-cart"));
    });
    await waitFor(() => expect(screen.getByText("Stok yetersiz.")).toBeTruthy());
    expect(fake.cartRows[0].quantity).toBe(5);
  });

  it("'Hemen Al' urunu sepete ekleyip odemeye gider", async () => {
    mockParams = { id: "105" };
    const { fake } = await renderWithStore(<ProductDetailScreen />);
    await waitFor(() => expect(screen.getByTestId("buy-now")).toBeTruthy());
    await act(async () => {
      await fireEvent.press(screen.getByTestId("buy-now"));
    });
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("/pages/store/checkout")));
    expect(fake.cartRows).toHaveLength(1);
  });
});

describe("Sepet", () => {
  const seeded = () => createFakeStore({ cart: [{ productId: "104", quantity: 1, selectedVariant: { size: "m" } }] });

  it("bos sepette bos durum gosterir", async () => {
    await renderWithStore(<CartScreen />);
    await waitFor(() => expect(screen.getByTestId("cart-empty")).toBeTruthy());
    await fireEvent.press(screen.getByText("MB Shop'a dön"));
    expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringContaining("/pages/store"));
  });

  it("toplamlar sunucudan gelir; adet degisimi ve silme sunucuya gider", async () => {
    const fake = seeded();
    await renderWithStore(<CartScreen />, fake);
    const line = fake.cartRows[0].id;
    await waitFor(() => expect(screen.getByTestId(`cart-line-${line}`)).toBeTruthy());
    expect(text(`cart-variant-${line}`)).toBe("M");
    expect(text("summary-subtotal")).toMatch(/400,00/);
    expect(text("summary-discount")).toMatch(/100,00/);
    expect(text("summary-shipping")).toMatch(/49,90/);
    expect(text("summary-total")).toMatch(/349,90/);

    await act(async () => {
      await fireEvent.press(screen.getByTestId(`cart-qty-${line}-plus`));
    });
    await waitFor(() => expect(text("summary-total")).toMatch(/600,00/));
    expect(text("summary-shipping")).toBe("Ücretsiz");
    expect(fake.cartRows[0].quantity).toBe(2);

    await act(async () => {
      await fireEvent.press(screen.getByTestId(`cart-remove-${line}`));
    });
    await waitFor(() => expect(screen.getByTestId("cart-empty")).toBeTruthy());
    expect(fake.cartRows).toEqual([]);
  });

  it("stogu tukenen satiri isaretler ve odemeyi kapatir", async () => {
    const fake = seeded();
    fake.products.find((p) => p.id === "104")!.stock = 0;
    await renderWithStore(<CartScreen />, fake);
    const line = fake.cartRows[0].id;
    await waitFor(() => expect(screen.getByTestId(`cart-unavailable-${line}`)).toBeTruthy());
    expect(screen.getByTestId("cart-blocked")).toBeTruthy();
    expect(screen.getByTestId("go-checkout").props.accessibilityState.disabled).toBe(true);
  });
});

describe("Checkout ve siparis", () => {
  it("kayitli adres yoksa form acilir; eksik/hatali bilgiyle ilerlemez", async () => {
    const fake = createFakeStore({ cart: [{ productId: "105", quantity: 1, selectedVariant: {} }], addresses: [] });
    await renderWithStore(<CheckoutScreen />, fake);
    await waitFor(() => expect(screen.getByTestId("field-fullName")).toBeTruthy());
    await fireEvent.press(screen.getByTestId("checkout-next"));
    expect(screen.getByTestId("error-fullName")).toBeTruthy();
    expect(screen.queryByTestId("step-summary")).toBeNull();

    await fireEvent.changeText(screen.getByTestId("field-title"), "Ev");
    await fireEvent.changeText(screen.getByTestId("field-fullName"), "Ayşe Yılmaz");
    await fireEvent.changeText(screen.getByTestId("field-phone"), "123");
    await fireEvent.changeText(screen.getByTestId("field-city"), "İstanbul");
    await fireEvent.changeText(screen.getByTestId("field-district"), "Kadıköy");
    await fireEvent.changeText(screen.getByTestId("field-address"), "Örnek Mah. Deneme Sok. No: 1");
    await fireEvent.press(screen.getByTestId("checkout-next"));
    expect(screen.getByTestId("error-phone")).toBeTruthy();
    expect(fake.addresses).toEqual([]);

    await fireEvent.changeText(screen.getByTestId("field-phone"), "05321234567");
    await act(async () => {
      await fireEvent.press(screen.getByTestId("checkout-next"));
    });
    await waitFor(() => expect(screen.getByTestId("step-summary")).toBeTruthy());
    expect(fake.addresses).toEqual([expect.objectContaining({ fullName: "Ayşe Yılmaz", isDefault: true })]);
  });

  it("siparis olusur: sunucu toplami onaylanir, sepet bosalir, basari ekranina gider; kart odemesi kapalidir", async () => {
    const fake = createFakeStore({ cart: [{ productId: "104", quantity: 2, selectedVariant: { size: "m" } }] });
    const createSpy = jest.spyOn(fake.services.orders, "create");
    await renderWithStore(<CheckoutScreen />, fake);
    await waitFor(() => expect(screen.getByTestId("step-delivery")).toBeTruthy());
    await pressNext();
    await waitFor(() => expect(screen.getByTestId("step-summary")).toBeTruthy());
    expect(text("summary-total")).toMatch(/600,00/);
    await pressNext();
    await waitFor(() => expect(screen.getByTestId("payment-card")).toBeTruthy());
    expect(screen.getByTestId("payment-card").props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId("payment-bank_transfer"));

    await act(async () => {
      await fireEvent.press(screen.getByTestId("checkout-next"));
    });
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalled());
    const arg = mockRouter.replace.mock.calls[0][0] as { pathname: string; params: { orderId: string } };
    expect(arg.pathname).toBe("/pages/store/order-success");
    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ addressId: "1", paymentMethod: "bank_transfer", expectedTotal: 600 }));
    expect(createSpy.mock.calls[0][0].idempotencyKey).toEqual(expect.any(String));
    expect(fake.orders[0]).toMatchObject({ id: arg.params.orderId, status: "received", paymentStatus: "pending", total: 600 });
    expect(fake.products.find((p) => p.id === "104")!.stock).toBe(8);
    await waitFor(() => expect(store().cart.items).toEqual([]));
    expect(store().orderCount).toBe(1);
  });

  it("fiyat degistiyse siparis olusmaz, kullanici ozet adimina doner ve yeni tutari gorur", async () => {
    const fake = createFakeStore({ cart: [{ productId: "105", quantity: 1, selectedVariant: {} }] });
    await renderWithStore(<CheckoutScreen />, fake);
    await waitFor(() => expect(screen.getByTestId("step-delivery")).toBeTruthy());
    await pressNext();
    await waitFor(() => expect(screen.getByTestId("step-summary")).toBeTruthy());
    await pressNext();
    await waitFor(() => expect(screen.getByTestId("step-payment")).toBeTruthy());

    fake.products.find((p) => p.id === "105")!.price = 700;
    await act(async () => {
      await fireEvent.press(screen.getByTestId("checkout-next"));
    });
    await waitFor(() => expect(screen.getByTestId("step-summary")).toBeTruthy());
    expect(fake.orders).toEqual([]);
    expect(screen.getByTestId("checkout-error")).toBeTruthy();
    await waitFor(() => expect(text("summary-total")).toMatch(/700,00/));
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("ag hatasinda ayni idempotency anahtariyla tekrar dener; cift siparis olusmaz", async () => {
    const fake = createFakeStore({ cart: [{ productId: "105", quantity: 1, selectedVariant: {} }] });
    const original = fake.services.orders.create;
    const keys: string[] = [];
    fake.services.orders.create = jest.fn(async (input) => {
      keys.push(input.idempotencyKey);
      const order = await original(input);
      // Ilk denemede siparis sunucuda olustu ama yanit kayboldu.
      if (keys.length === 1) throw new NetworkError("http://api");
      return order;
    });
    await renderWithStore(<CheckoutScreen />, fake);
    await waitFor(() => expect(screen.getByTestId("step-delivery")).toBeTruthy());
    await pressNext();
    await waitFor(() => expect(screen.getByTestId("step-summary")).toBeTruthy());
    await pressNext();
    await waitFor(() => expect(screen.getByTestId("step-payment")).toBeTruthy());

    await act(async () => {
      await fireEvent.press(screen.getByTestId("checkout-next"));
    });
    await waitFor(() => expect(screen.getByTestId("checkout-error")).toBeTruthy());
    expect(mockRouter.replace).not.toHaveBeenCalled();

    await act(async () => {
      await fireEvent.press(screen.getByTestId("checkout-next"));
    });
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalled());
    expect(keys).toHaveLength(2);
    expect(keys[1]).toBe(keys[0]);
    expect(fake.orders).toHaveLength(1);
  });

  it("basari ekrani siparis numarasini ve havale bilgisini sunucudan gosterir", async () => {
    const fake = createFakeStore({ cart: [{ productId: "105", quantity: 1, selectedVariant: {} }] });
    const order = await fake.services.orders.create({ addressId: "1", paymentMethod: "bank_transfer", idempotencyKey: "k1", expectedTotal: 600 });
    mockParams = { orderId: order.id };
    await renderWithStore(<OrderSuccessScreen />, fake);
    await waitFor(() => expect(screen.getByTestId("order-number")).toBeTruthy());
    expect(text("order-number")).toBe(order.orderNumber);
    expect(screen.getByTestId("bank-transfer-info")).toBeTruthy();
    expect(screen.queryByText(/demo/i)).toBeNull();
    await fireEvent.press(screen.getByTestId("go-orders"));
    expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringContaining("/pages/store/orders"));
  });

  it("Siparislerim sunucudaki siparisleri listeler; detayda iptal edilebilir", async () => {
    const fake = createFakeStore({ cart: [{ productId: "105", quantity: 2, selectedVariant: {} }] });
    const order = await fake.services.orders.create({ addressId: "1", paymentMethod: "cash_on_delivery", idempotencyKey: "k2", expectedTotal: 1200 });
    const list = await renderWithStore(<OrdersScreen />, fake);
    await waitFor(() => expect(screen.getByTestId(`order-${order.id}`)).toBeTruthy());
    expect(screen.getByText(order.orderNumber)).toBeTruthy();
    expect(screen.getByTestId("status-received")).toBeTruthy();
    await fireEvent.press(screen.getByTestId(`order-${order.id}`));
    expect(mockRouter.push).toHaveBeenCalledWith(`/pages/store/orders/${order.id}`);
    await list.unmount();

    mockParams = { id: order.id };
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === "destructive")?.onPress?.();
    });
    await renderWithStore(<OrderDetailScreen />, fake);
    await waitFor(() => expect(screen.getByTestId("order-cancel")).toBeTruthy());
    await act(async () => {
      await fireEvent.press(screen.getByTestId("order-cancel"));
    });
    await waitFor(() => expect(screen.getByTestId("order-cancelled")).toBeTruthy());
    expect(screen.queryByTestId("order-cancel")).toBeNull();
    expect(fake.orders[0].status).toBe("cancelled");
    expect(fake.products.find((p) => p.id === "105")!.stock).toBe(9);
    alertSpy.mockRestore();
  });

  it("baskasina ait / olmayan sipariste bulunamadi gosterir", async () => {
    mockParams = { id: "424242" };
    await renderWithStore(<OrderDetailScreen />);
    await waitFor(() => expect(screen.getByTestId("order-not-found")).toBeTruthy());
  });
});

describe("Favoriler ve adresler", () => {
  it("Favoriler: bos durum, listeleme ve cikarma", async () => {
    const empty = await renderWithStore(<FavoritesScreen />);
    await waitFor(() => expect(screen.getByTestId("favorites-empty")).toBeTruthy());
    await empty.unmount();

    const fake = createFakeStore({ favorites: ["105"] });
    await renderWithStore(<FavoritesScreen />, fake);
    await waitFor(() => expect(screen.getByTestId("product-card-105")).toBeTruthy());
    await act(async () => {
      await fireEvent.press(screen.getByTestId("favorite-105"));
    });
    await waitFor(() => expect(screen.getByTestId("favorites-empty")).toBeTruthy());
    expect(fake.favorites).toEqual([]);
  });

  it("Adresler: sunucu hatasini gosterir, silme sunucuya gider", async () => {
    const fake = createFakeStore();
    fake.services.addresses.remove = jest.fn().mockRejectedValueOnce(new ApiError(409, "Bu adres silinemedi."));
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === "destructive")?.onPress?.();
    });
    await renderWithStore(<AddressesScreen />, fake);
    await waitFor(() => expect(screen.getByTestId("address-1")).toBeTruthy());
    await act(async () => {
      await fireEvent.press(screen.getByTestId("delete-address-1"));
    });
    await waitFor(() => expect(screen.getByTestId("address-notice")).toBeTruthy());
    expect(screen.getByText("Bu adres silinemedi.")).toBeTruthy();
    expect(screen.getByTestId("address-1")).toBeTruthy();
    alertSpy.mockRestore();
  });
});
