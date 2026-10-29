import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ReactNode } from "react";

import { mockThemeValue } from "../../../test/mockTheme";
import { createDummyStoreServices } from "../services/dummy";
import { StoreProvider, useStore } from "../state/StoreContext";
import { CartScreen } from "../screens/CartScreen";
import { CheckoutScreen } from "../screens/CheckoutScreen";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { OrderSuccessScreen } from "../screens/OrderSuccessScreen";
import { OrdersScreen } from "../screens/OrdersScreen";
import { ProductDetailScreen } from "../screens/ProductDetailScreen";
import { ProductListScreen } from "../screens/ProductListScreen";
import { StoreHomeScreen } from "../screens/StoreHomeScreen";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: jest.fn(() => true) };
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (cb: () => void | (() => void)) => React.useEffect(cb, [cb]),
  };
});
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

async function renderWithStore(ui: ReactNode, services = createDummyStoreServices()) {
  const utils = render(
    <StoreProvider services={services}>
      <Probe />
      {ui}
    </StoreProvider>,
  );
  await waitFor(() => expect(probe.store?.isLoading).toBe(false));
  return utils;
}

const store = () => {
  if (!probe.store) throw new Error("store yok");
  return probe.store;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  probe.store = null;
});

describe("Store ana sayfa", () => {
  it("kampanyalari en ustte, sonra kategorileri ve urun gruplarini gosterir", async () => {
    await renderWithStore(<StoreHomeScreen />);
    expect(screen.getByText("İndirimler ve Kampanyalar")).toBeTruthy();
    expect(screen.getByTestId("campaign-camp-giyim")).toBeTruthy();
    expect(screen.getByTestId("category-cat-protein")).toBeTruthy();
    for (const title of ["Çok Satanlar", "İndirimdekiler", "Senin İçin Seçtiklerimiz", "Yeni Gelenler"]) {
      expect(screen.getByText(title)).toBeTruthy();
    }
  });

  it("arama urun adi ve marka uzerinden gercekten filtreler", async () => {
    await renderWithStore(<StoreHomeScreen />);
    fireEvent.changeText(screen.getByTestId("store-search"), "kettlebell");
    expect(screen.getByTestId("product-card-p-011")).toBeTruthy();
    expect(screen.queryByTestId("product-card-p-001")).toBeNull();
    expect(screen.queryByTestId("campaign-list")).toBeNull();

    fireEvent.changeText(screen.getByTestId("store-search"), "purelab");
    expect(screen.getByTestId("product-card-p-003")).toBeTruthy();
    expect(screen.queryByTestId("product-card-p-011")).toBeNull();

    fireEvent.changeText(screen.getByTestId("store-search"), "olmayan urun");
    expect(screen.getByTestId("search-empty")).toBeTruthy();
  });

  it("kategoriye dokununca kategori listesi rotasina gider", async () => {
    await renderWithStore(<StoreHomeScreen />);
    fireEvent.press(screen.getByTestId("category-cat-giyim"));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/pages/store/products", params: expect.objectContaining({ categoryId: "cat-giyim" }) }));
  });

  it("kampanya kartina dokununca kampanya urun listesine gider", async () => {
    await renderWithStore(<StoreHomeScreen />);
    fireEvent.press(screen.getByTestId("campaign-camp-ekipman"));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.objectContaining({ params: expect.objectContaining({ campaignId: "camp-ekipman" }) }));
  });

  it("favori ve hizli ekleme calisir; sepet sayaci guncellenir", async () => {
    await renderWithStore(<StoreHomeScreen />);
    expect(screen.queryByTestId("cart-badge")).toBeNull();
    // p-014 shaker: varyantli (renk) oldugu icin hizli ekleme detay acar
    fireEvent.press(screen.getAllByTestId("quick-add-p-014")[0]);
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("/pages/store/product/p-014"));
    expect(store().cartItems).toHaveLength(0);
    // p-024 masaj tabancasi: varyantsiz -> dogrudan sepete
    await act(async () => {
      fireEvent.press(screen.getAllByTestId("quick-add-p-024")[0]);
    });
    expect(store().cartItems).toHaveLength(1);
    expect(screen.getByTestId("cart-badge")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getAllByTestId("favorite-p-024")[0]);
    });
    expect(store().favoriteIds).toEqual(["p-024"]);
    await act(async () => {
      fireEvent.press(screen.getAllByTestId("favorite-p-024")[0]);
    });
    expect(store().favoriteIds).toEqual([]);
  });

  it("katalog yuklenemezse hata durumu ve tekrar dene gosterir", async () => {
    const services = createDummyStoreServices();
    const original = services.catalog.getProducts;
    services.catalog.getProducts = jest.fn().mockRejectedValueOnce(new Error("Sunucuya ulaşılamadı.")).mockImplementation(original);
    render(
      <StoreProvider services={services}>
        <Probe />
        <StoreHomeScreen />
      </StoreProvider>,
    );
    expect(await screen.findByTestId("store-error")).toBeTruthy();
    expect(screen.getByText("Sunucuya ulaşılamadı.")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText("Tekrar dene"));
    });
    await waitFor(() => expect(screen.queryByTestId("store-error")).toBeNull());
    expect(screen.getByTestId("campaign-list")).toBeTruthy();
  });
});

describe("Urun listesi: kategori, arama, filtre, siralama", () => {
  it("kategori filtresi ve siralama gercekten calisir", async () => {
    mockParams = { categoryId: "cat-giyim" };
    await renderWithStore(<ProductListScreen />);
    expect(screen.getByTestId("product-card-p-005")).toBeTruthy();
    expect(screen.queryByTestId("product-card-p-001")).toBeNull();

    fireEvent.press(screen.getByTestId("chip-cat-protein"));
    expect(screen.getByTestId("product-card-p-001")).toBeTruthy();
    expect(screen.queryByTestId("product-card-p-005")).toBeNull();

    fireEvent.press(screen.getByTestId("open-filters"));
    fireEvent.press(screen.getByTestId("sort-price_asc"));
    fireEvent.press(screen.getByTestId("switch-stock"));
    fireEvent(screen.getByTestId("switch-stock"), "valueChange", true);
    fireEvent.press(screen.getByTestId("filter-apply"));
    const prices = screen.getAllByTestId(/^product-card-/).map((n) => n.props.accessibilityLabel as string);
    // Stoksuz BCAA (p-003) stoktakiler filtresiyle listeden cikar.
    expect(prices.some((l) => l.includes("BCAA"))).toBe(false);
    expect(prices[0]).toContain("Kreatin"); // en ucuz protein urunu
  });

  it("sonuc yoksa 'Ürün bulunamadı' gosterir", async () => {
    mockParams = { q: "yokboyleurun" };
    await renderWithStore(<ProductListScreen />);
    expect(screen.getByTestId("list-empty")).toBeTruthy();
  });
});

describe("Urun detay", () => {
  it("bulunamayan urunde anlasilir mesaj gosterir", async () => {
    mockParams = { id: "yok" };
    await renderWithStore(<ProductDetailScreen />);
    expect(screen.getByTestId("product-not-found")).toBeTruthy();
  });

  it("varyant secilmeden sepete eklemeyi engeller, secimle secilen urun/varyant/adedi aktarir", async () => {
    mockParams = { id: "p-001" };
    await renderWithStore(<ProductDetailScreen />);

    await act(async () => {
      fireEvent.press(screen.getByTestId("add-to-cart"));
    });
    expect(store().cartItems).toHaveLength(0);
    expect(screen.getByTestId("detail-notice")).toBeTruthy();

    fireEvent.press(screen.getByTestId("variant-package-3kg"));
    fireEvent.press(screen.getByTestId("variant-flavor-vanilla"));
    expect(screen.getByTestId("detail-total").props.children).toMatch(/1\.869,90/);

    fireEvent.press(screen.getByTestId("detail-qty-plus"));
    expect(screen.getByTestId("detail-qty-value").props.children).toBe(2);
    expect(screen.getByTestId("detail-total").props.children).toMatch(/3\.739,80/);

    await act(async () => {
      fireEvent.press(screen.getByTestId("add-to-cart"));
    });
    expect(store().cartItems).toEqual([{ productId: "p-001", quantity: 2, selectedVariant: { package: "3kg", flavor: "vanilla" }, unitPrice: 1869.9 }]);

    // ayni urun + varyant tekrar eklenince birlesir
    await act(async () => {
      fireEvent.press(screen.getByTestId("add-to-cart"));
    });
    expect(store().cartItems).toHaveLength(1);
    expect(store().cartItems[0].quantity).toBe(4);
  });

  it("stokta olmayan varyanti secilemez yapar ve stoksuz urunde satin almayi kapatir", async () => {
    mockParams = { id: "p-001" };
    const first = await renderWithStore(<ProductDetailScreen />);
    expect(screen.getByTestId("variant-flavor-caramel").props.accessibilityState.disabled).toBe(true);
    first.unmount();

    mockParams = { id: "p-003" };
    await renderWithStore(<ProductDetailScreen />);
    expect(screen.getByTestId("add-to-cart").props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId("buy-now").props.accessibilityState.disabled).toBe(true);
    expect(screen.queryByTestId("detail-qty-plus")).toBeNull();
  });

  it("'Hemen Al' urunu sepete ekleyip odemeye gider", async () => {
    mockParams = { id: "p-011" };
    await renderWithStore(<ProductDetailScreen />);
    await act(async () => {
      fireEvent.press(screen.getByTestId("buy-now"));
    });
    expect(store().cartItems).toHaveLength(1);
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("/pages/store/checkout"));
  });

  it("detaydaki favori, magaza durumuyla senkron calisir", async () => {
    mockParams = { id: "p-002" };
    await renderWithStore(<ProductDetailScreen />);
    await act(async () => {
      fireEvent.press(screen.getByTestId("detail-favorite"));
    });
    expect(store().favoriteIds).toContain("p-002");
  });
});

describe("Sepet", () => {
  async function seed() {
    const services = createDummyStoreServices();
    await services.cart.addItem({ productId: "p-005", quantity: 1, selectedVariant: { size: "m", color: "black" } });
    return services;
  }

  it("bos sepette bos durum ve Store'a don butonu gosterir", async () => {
    await renderWithStore(<CartScreen />);
    expect(screen.getByTestId("cart-empty")).toBeTruthy();
    fireEvent.press(screen.getByText("Store'a dön"));
    expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringContaining("/pages/store"));
  });

  it("adet degisince ve satir kalkinca toplamlar guncellenir", async () => {
    await renderWithStore(<CartScreen />, await seed());
    expect(screen.getByTestId("cart-variant-p-005").props.children).toBe("M · Siyah");
    expect(screen.getByTestId("summary-subtotal").props.children).toMatch(/399,90/);
    expect(screen.getByTestId("summary-discount").props.children).toMatch(/100,00/);
    expect(screen.getByTestId("summary-shipping").props.children).toMatch(/49,90/);
    expect(screen.getByTestId("summary-total").props.children).toMatch(/349,80/);

    await act(async () => {
      fireEvent.press(screen.getByTestId("cart-qty-p-005-plus"));
    });
    expect(screen.getByTestId("summary-total").props.children).toMatch(/599,80/); // 599,80 >= 500: kargo ucretsiz
    expect(screen.getByTestId("summary-shipping").props.children).toBe("Ücretsiz");

    await act(async () => {
      fireEvent.press(screen.getByTestId("cart-qty-p-005-minus"));
    });
    expect(store().cartItems[0].quantity).toBe(1);

    await act(async () => {
      fireEvent.press(screen.getByTestId("cart-remove-p-005"));
    });
    expect(screen.getByTestId("cart-empty")).toBeTruthy();
  });

  it("alisverise devam et ve odeme adimina gec butonlari calisir", async () => {
    await renderWithStore(<CartScreen />, await seed());
    fireEvent.press(screen.getByTestId("go-checkout"));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("/pages/store/checkout"));
    fireEvent.press(screen.getByTestId("continue-shopping"));
    expect(mockRouter.replace).toHaveBeenCalled();
  });
});

describe("Checkout, siparis ve favoriler", () => {
  it("eksik/hatali teslimat bilgisiyle sonraki adima gecmez", async () => {
    const services = createDummyStoreServices();
    await services.cart.addItem({ productId: "p-011", quantity: 1, selectedVariant: {} });
    await services.addresses.removeAddress("addr-1");
    await services.addresses.removeAddress("addr-2");
    await renderWithStore(<CheckoutScreen />, services);

    fireEvent.press(screen.getByTestId("checkout-next"));
    expect(screen.getByTestId("error-fullName")).toBeTruthy();
    expect(screen.getByTestId("error-phone")).toBeTruthy();
    expect(screen.queryByTestId("step-summary")).toBeNull();

    fireEvent.changeText(screen.getByTestId("field-title"), "Ev");
    fireEvent.changeText(screen.getByTestId("field-fullName"), "Ayşe Yılmaz");
    fireEvent.changeText(screen.getByTestId("field-phone"), "123");
    fireEvent.changeText(screen.getByTestId("field-city"), "İstanbul");
    fireEvent.changeText(screen.getByTestId("field-district"), "Kadıköy");
    fireEvent.changeText(screen.getByTestId("field-address"), "Örnek Mah. Deneme Sok. No: 1");
    fireEvent.press(screen.getByTestId("checkout-next"));
    expect(screen.getByTestId("error-phone")).toBeTruthy();
    expect(screen.queryByTestId("step-summary")).toBeNull();
  });

  it("4 adimli demo akis: siparis olusur, sepet temizlenir, basari ekranina yonlenir, siparislerde gorunur", async () => {
    const services = createDummyStoreServices();
    await services.cart.addItem({ productId: "p-005", quantity: 2, selectedVariant: { size: "m", color: "black" } });
    await renderWithStore(<CheckoutScreen />, services);

    // Adim 1: kayitli adres on dolu gelir
    expect(screen.getByTestId("step-delivery")).toBeTruthy();
    fireEvent.press(screen.getByTestId("checkout-next"));

    // Adim 2: ozet
    expect(screen.getByTestId("step-summary")).toBeTruthy();
    expect(screen.getByTestId("summary-total").props.children).toMatch(/599,80/);
    fireEvent.press(screen.getByTestId("checkout-next"));

    // Adim 3: odeme (yalnizca demo secenekleri, kart alani yok)
    expect(screen.getByTestId("step-payment")).toBeTruthy();
    expect(screen.queryByTestId("field-cardNumber")).toBeNull();
    fireEvent.press(screen.getByTestId("payment-card_simulation"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("checkout-next"));
    });

    // Adim 4: tamamlandi
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalled());
    const arg = mockRouter.replace.mock.calls[0][0] as { pathname: string; params: { orderId: string } };
    expect(arg.pathname).toBe("/pages/store/order-success");
    const orderId = arg.params.orderId;
    expect(orderId).toMatch(/^MBF-/);
    expect(store().cartItems).toEqual([]);
    expect(store().orders[0]).toMatchObject({ id: orderId, status: "received", paymentMethod: "card_simulation", total: 599.8 });
    expect(screen.queryByTestId("checkout-empty")).toBeNull();
  });

  it("basari ekrani siparis numarasini ve Siparislerime git secenegini gosterir", async () => {
    const services = createDummyStoreServices();
    await services.cart.addItem({ productId: "p-011", quantity: 1, selectedVariant: {} });
    const order = await services.orders.createOrder({ items: await services.cart.getItems(), deliveryAddress: (await services.addresses.getAddresses())[0], paymentMethod: "bank_transfer" });
    mockParams = { orderId: order.id };
    await renderWithStore(<OrderSuccessScreen />, services);
    expect(screen.getByTestId("order-number").props.children).toBe(order.id);
    fireEvent.press(screen.getByTestId("go-orders"));
    expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringContaining("/pages/store/orders"));
  });

  it("Siparislerim demo siparisleri tum durumlariyla listeler ve detaya gider", async () => {
    await renderWithStore(<OrdersScreen />);
    for (const status of ["received", "preparing", "shipped", "delivered"]) expect(screen.getByTestId(`status-${status}`)).toBeTruthy();
    fireEvent.press(screen.getByTestId("order-MBF-261027-1042"));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("/pages/store/orders/MBF-261027-1042"));
  });

  it("Favoriler: bos durum, listeleme ve cikarma", async () => {
    const services = createDummyStoreServices();
    const first = await renderWithStore(<FavoritesScreen />, services);
    expect(screen.getByTestId("favorites-empty")).toBeTruthy();
    first.unmount();

    await services.favorites.toggle("p-011");
    await renderWithStore(<FavoritesScreen />, services);
    expect(screen.getByTestId("product-card-p-011")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId("favorite-p-011"));
    });
    expect(screen.getByTestId("favorites-empty")).toBeTruthy();
  });
});
