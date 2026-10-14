import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { Linking } from "react-native";

import { ApiError, apiRequest, NetworkError } from "../../../../services/api/client";
import {
  analyzeFoodPhoto,
  confirmFoodAnalysis,
  getFoodAnalysisStatus,
} from "../../../../services/api/foodAnalysis";
import { FoodAnalysisResult } from "../../../../services/api/types";
import { mockThemeValue } from "../../../../test/mockTheme";
import { searchFoods } from "../../../../services/api/foods";
import { AddMealModal } from "../components/AddMealModal";
import { FoodPhotoAnalysis } from "../components/FoodPhotoAnalysis";
import { computeTotals, MAX_PHOTO_DIMENSION, parseGrams, pickFoodPhoto, prepareFoodPhoto } from "../foodPhoto";

jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const mockContext = { resize: jest.fn(), renderAsync: jest.fn(), release: jest.fn() };
const mockImage = { saveAsync: jest.fn(), release: jest.fn() };
jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg", PNG: "png", WEBP: "webp" },
  ImageManipulator: { manipulate: jest.fn(() => mockContext) },
}));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
// Uygulama ici kamera: izin durumu ve cekim testten yonetilir; kamera hazir olunca onCameraReady cagrilir.
const mockCamera = {
  permission: { granted: true, canAskAgain: true } as { granted: boolean; canAskAgain: boolean } | null,
  requestPermission: jest.fn(),
  takePictureAsync: jest.fn(),
};
jest.mock("expo-camera", () => {
  const React = require("react");
  return {
    useCameraPermissions: () => [mockCamera.permission, mockCamera.requestPermission],
    CameraView: React.forwardRef((props: { onCameraReady?: () => void }, ref: unknown) => {
      React.useImperativeHandle(ref, () => ({ takePictureAsync: mockCamera.takePictureAsync }));
      React.useEffect(() => props.onCameraReady?.(), []);
      return null;
    }),
  };
});
jest.mock("../../../../services/api/foods", () => ({ searchFoods: jest.fn(), getFoodByBarcode: jest.fn() }));
jest.mock("../../../../services/api/nutrition", () => ({ logMealItem: jest.fn() }));
jest.mock("../../../../services/api/foodAnalysis", () => ({
  getFoodAnalysisStatus: jest.fn(),
  analyzeFoodPhoto: jest.fn(),
  confirmFoodAnalysis: jest.fn(),
}));

const picker = ImagePicker as jest.Mocked<typeof ImagePicker>;
const statusMock = getFoodAnalysisStatus as jest.MockedFunction<typeof getFoodAnalysisStatus>;
const analyzeMock = analyzeFoodPhoto as jest.MockedFunction<typeof analyzeFoodPhoto>;
const confirmMock = confirmFoodAnalysis as jest.MockedFunction<typeof confirmFoodAnalysis>;

const granted = { granted: true, canAskAgain: true, status: "granted", expires: "never" } as never;
const deniedForever = { granted: false, canAskAgain: false, status: "denied", expires: "never" } as never;

const analysis: FoodAnalysisResult = {
  analysisId: 28,
  foodName: "Pilav ve tavuk",
  items: [
    {
      itemId: 1,
      foodName: "Pirinç Pilavı",
      estimatedGrams: 200,
      minGrams: 150,
      maxGrams: 250,
      calories: 260,
      protein: 5.4,
      carbs: 56,
      fat: 0.6,
      per100g: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      confidence: 0.9,
      portionUncertainty: "low",
      needsPortionConfirmation: false,
      isEstimate: true,
      nutritionSource: "catalog",
      matchedFoodName: "Pirinç Pilavı",
      matchedFoodId: 9,
    },
    {
      itemId: 2,
      foodName: "Tavuk sote",
      estimatedGrams: 150,
      minGrams: 90,
      maxGrams: 220,
      calories: 240,
      protein: 30,
      carbs: 6,
      fat: 10.5,
      per100g: { calories: 160, protein: 20, carbs: 4, fat: 7 },
      confidence: 0.6,
      portionUncertainty: "high",
      needsPortionConfirmation: true,
      isEstimate: true,
      nutritionSource: "ai_estimate",
      note: "Sostaki yağ miktarı görünmüyor.",
    },
  ],
  totals: { estimatedGrams: 350, calories: 500, protein: 35.4, carbs: 62, fat: 11.1 },
  confidence: 0.75,
  isEstimate: true,
  needsPortionConfirmation: true,
  warnings: ["Tavuk sote porsiyonu belirsiz."],
  unidentifiedItems: ["kasedeki sos"],
  remainingAnalyses: 11,
  confirmBefore: "2026-10-15T08:00:00Z",
};

async function renderScreen(onLogged = jest.fn()) {
  // Durum (kalan hak) istegi acilista cozulur; act icinde beklenir.
  render(<FoodPhotoAnalysis mealType="Lunch" date="2026-10-14" onLogged={onLogged} onBack={jest.fn()} />);
  await act(async () => {});
  return onLogged;
}

async function openCamera() {
  await act(async () => {
    fireEvent.press(screen.getByTestId("food-photo-camera"));
  });
}

/** "Fotoğraf çek" -> pencere icindeki kamera -> deklansor. */
async function pickFromCamera() {
  await openCamera();
  await act(async () => {
    fireEvent.press(screen.getByTestId("food-camera-shutter"));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCamera.permission = { granted: true, canAskAgain: true };
  mockCamera.takePictureAsync.mockResolvedValue({ uri: "file:///photo.jpg", width: 4032, height: 3024, format: "jpg" });
  statusMock.mockResolvedValue({ enabled: true, dataNotice: "Fotoğrafın Google Gemini'ye gönderilir.", dailyLimit: 15, remainingAnalyses: 12 });
  picker.requestCameraPermissionsAsync.mockResolvedValue(granted);
  picker.requestMediaLibraryPermissionsAsync.mockResolvedValue(granted);
  picker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///photo.heic", width: 4032, height: 3024 }] } as never);
  picker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///gallery.png", width: 900, height: 1600 }] } as never);
  mockContext.resize.mockReturnValue(mockContext);
  mockContext.renderAsync.mockResolvedValue(mockImage);
  mockImage.saveAsync.mockResolvedValue({ uri: "file:///small.jpg", width: 1280, height: 960 });
});

describe("foodPhoto yardimcilari", () => {
  it("uzun kenari 1280 px'e indirir ve JPEG olarak sikistirir", async () => {
    const upload = await prepareFoodPhoto({ uri: "file:///photo.heic", width: 4032, height: 3024 });

    expect(mockContext.resize).toHaveBeenCalledWith({ width: MAX_PHOTO_DIMENSION });
    expect(mockImage.saveAsync).toHaveBeenCalledWith({ format: "jpeg", compress: 0.7 });
    expect(upload).toEqual({ uri: "file:///small.jpg", mimeType: "image/jpeg", fileName: "meal.jpg" });
    expect(mockImage.release).toHaveBeenCalled();
  });

  it("dikey fotografta yuksekligi sinirlar, kucuk fotografi buyutmez", async () => {
    await prepareFoodPhoto({ uri: "a", width: 900, height: 1600 });
    expect(mockContext.resize).toHaveBeenCalledWith({ height: MAX_PHOTO_DIMENSION });

    mockContext.resize.mockClear();
    await prepareFoodPhoto({ uri: "b", width: 800, height: 600 });
    expect(mockContext.resize).not.toHaveBeenCalled();
  });

  it("izin reddedilirse kamera acilmaz", async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValue(deniedForever);

    await expect(pickFoodPhoto("camera")).resolves.toEqual({ status: "denied", source: "camera", canAskAgain: false });
    expect(picker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it("gramaji ve toplamlari hesaplar", () => {
    expect(parseGrams("180,5")).toBe(180.5);
    expect(parseGrams("0")).toBeNull();
    expect(parseGrams("3001")).toBeNull();
    expect(parseGrams("abc")).toBeNull();

    const totals = computeTotals(analysis.items, { 1: 100, 2: 50 }, { 1: true, 2: true });
    expect(totals.calories).toBeCloseTo(130 + 80);
    expect(totals.protein).toBeCloseTo(2.7 + 10);
    expect(computeTotals(analysis.items, { 1: 100, 2: 50 }, { 1: true, 2: false }).calories).toBeCloseTo(130);
  });
});

describe("FoodPhotoAnalysis", () => {
  it("analiz oncesi veri kullanimi bilgisini ve kalan hakki gosterir", async () => {
    await renderScreen();

    expect(await screen.findByText("Bugün kalan analiz hakkın: 12/15")).toBeTruthy();
    expect(screen.getByTestId("food-photo-notice").props.children).toContain("Google Gemini");
  });

  it("kamera izni kalici reddedilirse uyarir, ayarlara yonlendirir ve yukleme yapmaz", async () => {
    mockCamera.permission = { granted: false, canAskAgain: false };
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined);
    await renderScreen();

    await openCamera();

    expect(await screen.findByText("Fotoğraf çekmek için kamera izni gerekiyor.")).toBeTruthy();
    fireEvent.press(screen.getByText("Ayarları aç"));
    expect(openSettings).toHaveBeenCalled();
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it("galeri izni reddedilirse uyarir", async () => {
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true, status: "denied", expires: "never" } as never);
    await renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId("food-photo-library"));
    });

    expect(await screen.findByText("Galeriden fotoğraf seçmek için fotoğraflara erişim izni gerekiyor.")).toBeTruthy();
    expect(screen.queryByText("Ayarları aç")).toBeNull();
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it("Fotoğraf çek pencere icinde kamerayi acar; vazgecilirse analiz yapilmaz", async () => {
    await renderScreen();

    await openCamera();
    expect(screen.getByTestId("food-camera-shutter")).toBeTruthy();
    expect(picker.launchCameraAsync).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText("Vazgeç"));

    expect(screen.getByTestId("food-photo-camera")).toBeTruthy();
    expect(mockCamera.takePictureAsync).not.toHaveBeenCalled();
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it("galeriden secilen fotograf da kucultulup analiz edilir", async () => {
    analyzeMock.mockResolvedValue(analysis);
    await renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId("food-photo-library"));
    });

    expect(mockContext.resize).toHaveBeenCalledWith({ height: MAX_PHOTO_DIMENSION });
    expect(analyzeMock).toHaveBeenCalledWith({ uri: "file:///small.jpg", mimeType: "image/jpeg", fileName: "meal.jpg" }, expect.anything());
  });

  it("kucultulmus JPEG'i yukler, yuklenirken bekleme gosterir ve sonuclari tek tek listeler", async () => {
    let resolve!: (value: FoodAnalysisResult) => void;
    analyzeMock.mockReturnValue(new Promise((r) => (resolve = r)));
    await renderScreen();

    await pickFromCamera();

    expect(await screen.findByTestId("food-photo-analyzing")).toBeTruthy();
    expect(mockCamera.takePictureAsync).toHaveBeenCalledTimes(1);
    expect(mockContext.resize).toHaveBeenCalledWith({ width: MAX_PHOTO_DIMENSION });
    expect(analyzeMock).toHaveBeenCalledWith({ uri: "file:///small.jpg", mimeType: "image/jpeg", fileName: "meal.jpg" }, expect.anything());

    await act(async () => resolve(analysis));

    expect(screen.getByText("Pilav ve tavuk")).toBeTruthy();
    expect(screen.getByTestId("food-photo-item-1")).toBeTruthy();
    expect(screen.getByTestId("food-photo-item-2")).toBeTruthy();
    expect(screen.getByTestId("food-photo-kcal-1").props.children).toBe("260 kcal");
    expect(screen.getByTestId("food-photo-kcal-2").props.children).toBe("240 kcal");
    expect(screen.getByText("500 kcal")).toBeTruthy();
    expect(screen.getByText(/Tanımlanamayanlar: kasedeki sos/)).toBeTruthy();
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it("porsiyon degisince kalori ve toplam aninda guncellenir", async () => {
    analyzeMock.mockResolvedValue(analysis);
    await renderScreen();
    await pickFromCamera();
    await screen.findByTestId("food-photo-item-1");

    fireEvent.changeText(screen.getByTestId("food-photo-grams-1"), "300");

    expect(screen.getByTestId("food-photo-kcal-1").props.children).toBe("390 kcal");
    expect(screen.getByText("630 kcal")).toBeTruthy();

    fireEvent.press(screen.getByTestId("food-photo-include-2"));
    expect(screen.getByText("Öğüne kaydet · 390 kcal")).toBeTruthy();
  });

  it("belirsiz porsiyon onaylanmadan ve gecersiz gramajla kaydetmez; onaydan sonra kaydeder", async () => {
    analyzeMock.mockResolvedValue(analysis);
    confirmMock.mockResolvedValue({
      analysisId: 28,
      alreadyLogged: false,
      entries: [
        { id: 91, type: "Öğle Yemeği", name: "Pirinç Pilavı", calories: 234 },
        { id: 92, type: "Öğle Yemeği", name: "Tavuk sote", calories: 192 },
      ],
    });
    const onLogged = await renderScreen();
    await pickFromCamera();
    await screen.findByTestId("food-photo-item-1");

    fireEvent.press(screen.getByTestId("food-photo-save"));
    expect(confirmMock).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId("food-photo-confirm-2"));
    fireEvent.changeText(screen.getByTestId("food-photo-grams-1"), "0");
    fireEvent.press(screen.getByTestId("food-photo-save"));
    expect(confirmMock).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByTestId("food-photo-grams-1"), "180");
    fireEvent.changeText(screen.getByTestId("food-photo-grams-2"), "120");
    await act(async () => {
      fireEvent.press(screen.getByTestId("food-photo-save"));
    });

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(confirmMock).toHaveBeenCalledWith(28, {
      date: "2026-10-14",
      mealType: "Lunch",
      items: [{ itemId: 1, grams: 180 }, { itemId: 2, grams: 120 }],
    });
    expect(onLogged).toHaveBeenCalledWith([
      { id: "91", type: "Öğle Yemeği", name: "Pirinç Pilavı", calories: 234 },
      { id: "92", type: "Öğle Yemeği", name: "Tavuk sote", calories: 192 },
    ]);
  });

  it("kayit basarisiz olursa hata gosterir ve kayit eklenmez", async () => {
    analyzeMock.mockResolvedValue({ ...analysis, items: [analysis.items[0]] });
    confirmMock.mockRejectedValue(new ApiError(400, "Bu analizin kaydetme süresi doldu. Lütfen yeni bir fotoğraf çek."));
    const onLogged = await renderScreen();
    await pickFromCamera();
    await screen.findByTestId("food-photo-item-1");

    await act(async () => {
      fireEvent.press(screen.getByTestId("food-photo-save"));
    });

    expect(screen.getByText("Bu analizin kaydetme süresi doldu. Lütfen yeni bir fotoğraf çek.")).toBeTruthy();
    expect(onLogged).not.toHaveBeenCalled();
  });

  it("analiz hatasinda Turkce mesaj ve tekrar dene gosterir; tekrar denemede ayni fotografi yukler", async () => {
    analyzeMock.mockRejectedValueOnce(new ApiError(503, "Fotoğraf analizi şu anda yapılamıyor. Lütfen biraz sonra tekrar dene."));
    analyzeMock.mockResolvedValueOnce(analysis);
    const onLogged = await renderScreen();
    await pickFromCamera();

    expect(await screen.findByText("Fotoğraf analizi şu anda yapılamıyor. Lütfen biraz sonra tekrar dene.")).toBeTruthy();
    expect(onLogged).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(screen.getByText("Tekrar dene"));
    });

    expect(analyzeMock).toHaveBeenCalledTimes(2);
    expect(analyzeMock.mock.calls[1][0]).toEqual(analyzeMock.mock.calls[0][0]);
    expect(screen.getByTestId("food-photo-item-1")).toBeTruthy();
    expect(mockCamera.takePictureAsync).toHaveBeenCalledTimes(1);
  });

  it("yemek bulunamadi gibi dogrulama hatalarinda tekrar dene yerine yeni fotograf ister", async () => {
    analyzeMock.mockRejectedValue(new ApiError(400, "Fotoğrafta yemek bulunamadı."));
    await renderScreen();
    await pickFromCamera();

    expect(await screen.findByText("Fotoğrafta yemek bulunamadı.")).toBeTruthy();
    expect(screen.queryByText("Tekrar dene")).toBeNull();
    fireEvent.press(screen.getByText("Başka fotoğraf seç"));
    expect(screen.getByTestId("food-photo-camera")).toBeTruthy();
  });

  it("ag hatasini anlasilir mesaja cevirir", async () => {
    analyzeMock.mockRejectedValue(new NetworkError());
    await renderScreen();
    await pickFromCamera();

    expect(await screen.findByText(/Sunucuya ulaşılamadı ya da analiz çok uzun sürdü/)).toBeTruthy();
    expect(screen.getByText("Tekrar dene")).toBeTruthy();
  });

  it("kota dolduysa fotograf secimini kapatir", async () => {
    statusMock.mockResolvedValue({ enabled: true, dataNotice: "x", dailyLimit: 15, remainingAnalyses: 0 });
    await renderScreen();

    expect(await screen.findByText(/Bugünlük fotoğraf analizi hakkın doldu/)).toBeTruthy();
    expect(screen.queryByTestId("food-photo-camera")).toBeNull();
  });
});

describe("AddMealModal fotograf adimi", () => {
  it("kamera dugmesi fotograf akisini acar ve onaylanan kayitlari ogun turu ve tarihle bildirir", async () => {
    (searchFoods as jest.Mock).mockResolvedValue({ items: [] });
    analyzeMock.mockResolvedValue({ ...analysis, items: [analysis.items[0]] });
    confirmMock.mockResolvedValue({ analysisId: 28, alreadyLogged: false, entries: [{ id: 91, type: "Akşam Yemeği", name: "Pirinç Pilavı", calories: 260 }] });
    const onLogged = jest.fn();
    render(
      <AddMealModal visible mealType="Akşam Yemeği" selectedDate={new Date(2026, 9, 13)} onLogged={onLogged} onClose={jest.fn()} />,
    );
    await act(async () => {});

    fireEvent.press(screen.getByTestId("add-meal-photo"));
    await act(async () => {});
    await pickFromCamera();
    await screen.findByTestId("food-photo-item-1");
    await act(async () => {
      fireEvent.press(screen.getByTestId("food-photo-save"));
    });

    expect(confirmMock).toHaveBeenCalledWith(28, expect.objectContaining({ mealType: "Dinner", date: "2026-10-13" }));
    expect(onLogged).toHaveBeenCalledWith([{ id: "91", type: "Akşam Yemeği", name: "Pirinç Pilavı", calories: 260 }]);
  });
});

describe("apiRequest FormData", () => {
  it("multipart govdeyi JSON'a cevirmez ve Content-Type'i fetch'e birakir", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "{}" });
    const original = globalThis.fetch;
    globalThis.fetch = fetchMock as never;
    try {
      const form = new FormData();
      await apiRequest("/api/food-analysis/analyze", { method: "POST", body: form, skipAuth: true });

      const init = fetchMock.mock.calls[0][1];
      expect(init.body).toBe(form);
      expect(init.headers["Content-Type"]).toBeUndefined();
    } finally {
      globalThis.fetch = original;
    }
  });
});
