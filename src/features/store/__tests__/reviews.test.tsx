import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ReactNode } from "react";
import { Alert } from "react-native";

import { mockThemeValue } from "../../../test/mockTheme";
import { createFakeStore, FakeStore, fakeReview } from "../../../test/storeFakes";
import { StoreProvider, useStore } from "../state/StoreContext";
import { ProductDetailScreen } from "../screens/ProductDetailScreen";
import { ReviewsScreen } from "../screens/ReviewsScreen";
import { WriteReviewScreen } from "../screens/WriteReviewScreen";
import { validateReview } from "../utils/reviewPhoto";

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
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: false,
    assets: [
      { uri: "file:///a.heic", width: 4000, height: 3000 },
      { uri: "file:///b.png", width: 800, height: 600 },
    ],
  })),
  launchCameraAsync: jest.fn(),
}));
const mockResize = jest.fn();
jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  ImageManipulator: {
    manipulate: (uri: string) => ({
      resize: (size: object) => mockResize(uri, size),
      renderAsync: async () => ({ saveAsync: async () => ({ uri: `${uri}.jpg` }), release: jest.fn() }),
      release: jest.fn(),
    }),
  },
}));

const probe: { store: ReturnType<typeof useStore> | null } = { store: null };
function Probe() {
  probe.store = useStore();
  return null;
}

async function renderWithStore(ui: ReactNode, fake: FakeStore) {
  const utils = await render(
    <StoreProvider services={fake.services}>
      <Probe />
      {ui}
    </StoreProvider>,
  );
  await waitFor(() => expect(probe.store?.isLoading).toBe(false));
  return utils;
}

const textOf = (testID: string) => {
  const children = screen.getByTestId(testID).props.children;
  return Array.isArray(children) ? children.join("") : String(children);
};

/** Alert.alert'in verilen butonuna basar. */
function pressAlertButton(label: string) {
  const call = (Alert.alert as jest.Mock).mock.calls.at(-1);
  const button = (call?.[2] as { text: string; onPress?: () => void }[]).find((b) => b.text === label);
  return act(async () => {
    await button?.onPress?.();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  mockParams = {};
  probe.store = null;
});

const reviewsFor101 = () => [
  fakeReview({ id: "1", productId: "101", rating: 5, helpfulCount: 4, isVerifiedPurchase: true, comment: "Çok iyi çözünüyor, tadı da güzel.", createdAt: "2026-10-03T10:00:00Z" }),
  fakeReview({ id: "2", productId: "101", rating: 4, helpfulCount: 1, comment: "Fiyatına göre iyi bir ürün.", createdAt: "2026-10-05T10:00:00Z", images: [{ id: "9", url: "https://x/9", width: 10, height: 10 }] }),
  fakeReview({ id: "3", productId: "101", rating: 1, comment: "Paket hasarlı geldi, memnun kalmadım.", createdAt: "2026-10-04T10:00:00Z" }),
  // Gizlenmis baskasinin yorumu ne listede ne ortalamada gorunur.
  fakeReview({ id: "4", productId: "101", rating: 1, status: "hidden", comment: "Gizlenmiş yorum metni burada." }),
];

describe("Urun detayindaki degerlendirmeler", () => {
  it("yorum yoksa sahte veri gostermez; bos durum ve Yorum yaz butonu gosterir", async () => {
    mockParams = { id: "102" };
    await renderWithStore(<ProductDetailScreen />, createFakeStore());
    expect(await screen.findByTestId("reviews-empty")).toBeTruthy();
    expect(screen.queryByTestId("review-summary")).toBeNull();
    expect(screen.getByText("Yorum yaz")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("write-review"));
    expect(mockRouter.push).toHaveBeenCalledWith("/pages/store/write-review/102");
  });

  it("ortalama, toplam ve dagilim yalnizca yayindaki yorumlardan gelir; onayli rozet gosterilir", async () => {
    mockParams = { id: "101" };
    await renderWithStore(<ProductDetailScreen />, createFakeStore({ reviews: reviewsFor101() }));
    expect(await screen.findByTestId("review-summary")).toBeTruthy();
    expect(textOf("review-average")).toBe("3,3");
    expect(textOf("review-count")).toBe("3 değerlendirme");
    expect(screen.getByTestId("distribution-1").props.accessibilityLabel).toBe("1 yıldız: 1 yorum");
    expect(screen.getByTestId("distribution-5").props.accessibilityLabel).toBe("5 yıldız: 1 yorum");
    // En faydali once.
    await waitFor(() => expect(screen.getAllByTestId("review-comment")[0].props.children).toBe("Çok iyi çözünüyor, tadı da güzel."));
    expect(screen.getAllByTestId("verified-badge")).toHaveLength(1);
    expect(screen.queryByText("Gizlenmiş yorum metni burada.")).toBeNull();
  });
});

describe("Faydali oyu ve bildir", () => {
  it("oy verir, degistirir ve ayni butonla geri alir; kendi yorumunda oy butonu yoktur", async () => {
    mockParams = { id: "101" };
    const fake = createFakeStore({ reviews: [...reviewsFor101(), fakeReview({ id: "5", productId: "101", mine: true, comment: "Benim kendi yorumum burada." })] });
    await renderWithStore(<ProductDetailScreen />, fake);
    await screen.findByTestId("review-1");
    const card = () => screen.getByTestId("review-1");
    const helpful = () => screen.getAllByTestId("vote-helpful")[0];

    await act(async () => {
      await fireEvent.press(helpful());
    });
    await waitFor(() => expect(helpful().props.accessibilityLabel).toBe("Evet, 5"));
    expect(fake.reviews.find((r) => r.id === "1")?.myVote).toBe(true);

    await act(async () => {
      await fireEvent.press(screen.getAllByTestId("vote-not-helpful")[0]);
    });
    await waitFor(() => expect(helpful().props.accessibilityLabel).toBe("Evet, 4"));
    expect(fake.reviews.find((r) => r.id === "1")?.myVote).toBe(false);

    await act(async () => {
      await fireEvent.press(screen.getAllByTestId("vote-not-helpful")[0]);
    });
    await waitFor(() => expect(fake.reviews.find((r) => r.id === "1")?.myVote).toBeNull());
    expect(card()).toBeTruthy();
  });

  it("kendi yorumunda oy ve bildir yerine duzenle/sil vardir; silme onayla yapilir", async () => {
    mockParams = { id: "102" };
    const fake = createFakeStore({ reviews: [fakeReview({ id: "5", productId: "102", mine: true, comment: "Benim kendi yorumum burada." })] });
    await renderWithStore(<ProductDetailScreen />, fake);
    await screen.findByTestId("review-5");
    expect(screen.queryByTestId("vote-helpful")).toBeNull();
    expect(screen.queryByTestId("review-report")).toBeNull();
    expect(screen.getByText("Yorumunu düzenle")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("review-delete"));
    await pressAlertButton("Sil");
    await waitFor(() => expect(screen.queryByTestId("review-5")).toBeNull());
    expect(fake.reviews[0].deleted).toBe(true);
    expect(await screen.findByTestId("reviews-empty")).toBeTruthy();
  });

  it("Diger sebebinde aciklama zorunludur; bildirim gonderilir", async () => {
    mockParams = { id: "101" };
    const fake = createFakeStore({ reviews: reviewsFor101() });
    await renderWithStore(<ProductDetailScreen />, fake);
    await screen.findByTestId("review-1");
    await fireEvent.press(screen.getAllByTestId("review-report")[0]);
    await fireEvent.press(await screen.findByTestId("report-reason-Other"));
    expect(screen.getByTestId("report-submit").props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId("report-description"), "Rakip firma reklamı");
    await act(async () => {
      await fireEvent.press(screen.getByTestId("report-submit"));
    });
    await waitFor(() => expect(textOf("reviews-notice")).toBe("Teşekkürler, bildirimin alındı."));
    expect(fake.reports).toEqual([{ reviewId: "1", reason: "Other", description: "Rakip firma reklamı" }]);
  });
});

describe("Tum yorumlar ekrani", () => {
  it("puan, fotografli ve onayli filtreleri ile siralama sunucuya gider", async () => {
    mockParams = { productId: "101" };
    const fake = createFakeStore({ reviews: reviewsFor101() });
    const spy = jest.spyOn(fake.services.reviews, "list");
    await renderWithStore(<ReviewsScreen />, fake);
    await screen.findByTestId("review-2");
    expect(screen.getAllByTestId(/^review-\d+$/).map((n) => n.props.testID)).toEqual(["review-2", "review-3", "review-1"]);

    await fireEvent.press(screen.getByTestId("review-sort-rating_asc"));
    await waitFor(() => expect(screen.getAllByTestId(/^review-\d+$/)[0].props.testID).toBe("review-3"));

    await fireEvent.press(screen.getByTestId("review-filter-rating-5"));
    await waitFor(() => expect(screen.getAllByTestId(/^review-\d+$/).map((n) => n.props.testID)).toEqual(["review-1"]));
    await fireEvent.press(screen.getByTestId("review-filter-rating-5"));

    await fireEvent.press(screen.getByTestId("review-filter-photos"));
    await waitFor(() => expect(screen.getAllByTestId(/^review-\d+$/).map((n) => n.props.testID)).toEqual(["review-2"]));
    await fireEvent.press(screen.getByTestId("review-filter-photos"));

    await fireEvent.press(screen.getByTestId("review-filter-verified"));
    await waitFor(() => expect(screen.getAllByTestId(/^review-\d+$/).map((n) => n.props.testID)).toEqual(["review-1"]));
    expect(spy).toHaveBeenLastCalledWith("101", { sort: "rating_asc", rating: undefined, withPhotos: false, verifiedOnly: true }, 1, 10, expect.anything());

    await fireEvent.press(screen.getByTestId("review-filter-rating-2"));
    expect(await screen.findByTestId("reviews-filter-empty")).toBeTruthy();
  });
});

describe("Yorum yaz / duzenle", () => {
  it("puan ve en az 10 karakter yorum zorunlu; gecersizse sunucuya gitmez", async () => {
    mockParams = { productId: "102" };
    const fake = createFakeStore();
    const create = jest.spyOn(fake.services.reviews, "create");
    await renderWithStore(<WriteReviewScreen />, fake);
    await fireEvent.changeText(await screen.findByTestId("review-comment-input"), "kısa");
    await act(async () => {
      await fireEvent.press(screen.getByTestId("review-submit"));
    });
    expect(create).not.toHaveBeenCalled();
    expect(screen.getByText("Lütfen puan ver")).toBeTruthy();
    expect(screen.getByText("Yorum en az 10 karakter olmalı.")).toBeTruthy();
  });

  it("yeni yorum olusturur, fotograflari kucultup yukler ve onayli alisveris rozetini sunucu belirler", async () => {
    mockParams = { productId: "102" };
    const fake = createFakeStore({ purchasedProductIds: ["102"] });
    await renderWithStore(<WriteReviewScreen />, fake);
    expect(await screen.findByTestId("write-review-verified")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("rating-4"));
    await fireEvent.changeText(screen.getByTestId("review-title"), "  Güzel kreatin ");
    await fireEvent.changeText(screen.getByTestId("review-comment-input"), "  Kullanımı kolay, iyi çözünüyor.  ");
    expect(textOf("review-comment-counter")).toBe("31/2000");

    await fireEvent.press(screen.getByTestId("review-add-photo"));
    await pressAlertButton("Galeri");
    expect(await screen.findByTestId("new-photo-1")).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByTestId("review-submit"));
    });
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
    const saved = fake.reviews[0];
    expect(saved).toMatchObject({ rating: 4, title: "Güzel kreatin", comment: "Kullanımı kolay, iyi çözünüyor.", isVerifiedPurchase: true, mine: true });
    expect(saved.images).toHaveLength(2);
    expect(fake.uploadedPhotos).toEqual(["file:///a.heic.jpg", "file:///b.png.jpg"]);
    // Yalnizca buyuk fotograf kucultulur.
    expect(mockResize).toHaveBeenCalledTimes(1);
    expect(mockResize).toHaveBeenCalledWith("file:///a.heic", { width: 1600 });
  });

  it("mevcut yorumla dolar, gunceller ve kaldirilan fotografi siler", async () => {
    mockParams = { productId: "102" };
    const fake = createFakeStore({
      reviews: [
        fakeReview({ id: "7", productId: "102", mine: true, rating: 2, title: "Eski", comment: "Eski yorum metnim burada.", images: [{ id: "70", url: "https://x/70", width: 10, height: 10 }] }),
      ],
    });
    const create = jest.spyOn(fake.services.reviews, "create");
    await renderWithStore(<WriteReviewScreen />, fake);
    expect(await screen.findByText("Değişiklikleri kaydet")).toBeTruthy();
    expect(screen.getByTestId("review-comment-input").props.value).toBe("Eski yorum metnim burada.");
    await fireEvent.press(screen.getByTestId("rating-5"));
    await fireEvent.press(screen.getByTestId("existing-photo-70-remove"));
    await act(async () => {
      await fireEvent.press(screen.getByTestId("review-submit"));
    });
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
    expect(create).not.toHaveBeenCalled();
    expect(fake.reviews[0]).toMatchObject({ rating: 5, images: [] });
    expect(fake.reviews[0].editedAt).not.toBeNull();
  });

  it("sunucu ikinci yorumu reddederse (REVIEW_EXISTS) hatayi gosterir", async () => {
    mockParams = { productId: "102" };
    const fake = createFakeStore();
    await renderWithStore(<WriteReviewScreen />, fake);
    await screen.findByTestId("review-comment-input");
    // Baska bir cihazdan ayni anda yorum yazilmis gibi.
    fake.reviews.push(fakeReview({ id: "8", productId: "102", mine: true }));
    await fireEvent.press(screen.getByTestId("rating-3"));
    await fireEvent.changeText(screen.getByTestId("review-comment-input"), "Yeterince uzun bir yorum.");
    await act(async () => {
      await fireEvent.press(screen.getByTestId("review-submit"));
    });
    expect(await screen.findByTestId("write-review-error")).toBeTruthy();
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(fake.reviews.filter((r) => r.mine)).toHaveLength(1);
  });
});

describe("validateReview", () => {
  it("sinirlari uygular", () => {
    expect(validateReview({ rating: 0, title: "", comment: "x".repeat(10) })).toEqual({ rating: "Lütfen 1-5 arası bir puan ver." });
    expect(validateReview({ rating: 5, title: "", comment: " ".repeat(5) + "x".repeat(9) })).toHaveProperty("comment");
    expect(validateReview({ rating: 5, title: "t".repeat(101), comment: "x".repeat(2001) })).toEqual({
      title: "Başlık en fazla 100 karakter olabilir.",
      comment: "Yorum en fazla 2000 karakter olabilir.",
    });
    expect(validateReview({ rating: 3, title: "", comment: "Gayet güzel ürün." })).toEqual({});
  });
});
