import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { mockThemeValue } from "../../../../test/mockTheme";
import { makeEnergyDay } from "../../../../test/energyFixtures";
import { CalorieBalanceCard } from "../components/CalorieBalanceCard";
import { CampaignsSection } from "../components/CampaignsSection";
import { QuickStats } from "../components/QuickStats";
import { TodayStartCard } from "../components/TodayStartCard";
import { usableImageUrls } from "../components/useImageCycle";

jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../../../shared/motion/useReducedMotion", () => ({ useReducedMotion: () => false }));
jest.mock("expo-image", () => {
  const { View } = jest.requireActual("react-native");
  return { Image: (props: object) => <View {...props} /> };
});

describe("TodayStartCard", () => {
  it("yalnizca http(s) gorselleri, tekrarsiz kullanir", () => {
    expect(usableImageUrls([null, "", "file:///a.jpg", "https://x/a.jpg", "https://x/a.jpg", " http://x/b.png "])).toEqual([
      "https://x/a.jpg",
      "http://x/b.png",
    ]);
  });

  it("gorseller arasinda doner, yuklenemeyeni atlar ve hic kalmazsa yedek gorunume duser", () => {
    jest.useFakeTimers();
    const onPress = jest.fn();
    render(
      <TodayStartCard testID="card" images={["https://x/1.jpg", "https://x/2.jpg"]} badge="BUGÜN" title="Üst Vücut" ctaLabel="Antrenmana Başla" onPress={onPress} />,
    );
    expect(screen.getByTestId("card-image").props.source).toEqual({ uri: "https://x/1.jpg" });
    act(() => jest.advanceTimersByTime(4000));
    expect(screen.getByTestId("card-image").props.source).toEqual({ uri: "https://x/2.jpg" });

    act(() => screen.getByTestId("card-image").props.onError());
    expect(screen.getByTestId("card-image").props.source).toEqual({ uri: "https://x/1.jpg" });
    act(() => screen.getByTestId("card-image").props.onError());
    expect(screen.getByTestId("card-fallback")).toBeTruthy();

    fireEvent.press(screen.getByTestId("card"));
    expect(onPress).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("gorsel yoksa yedek gradient gosterir", () => {
    render(<TodayStartCard testID="card" images={[]} badge="BUGÜN" title="X" ctaLabel="Başla" onPress={jest.fn()} />);
    expect(screen.getByTestId("card-fallback")).toBeTruthy();
  });
});

describe("CalorieBalanceCard", () => {
  it("alinan, harcanan, denge ve kalan kaloriyi sunucu degerlerinden gosterir", async () => {
    const onPress = jest.fn();
    await render(<CalorieBalanceCard day={makeEnergyDay()} loading={false} error={false} onPress={onPress} />);
    expect(screen.getByText("1.200 kcal")).toBeTruthy();
    expect(screen.getByText("1.300 kcal")).toBeTruthy();
    expect(screen.getByText("800")).toBeTruthy();
    expect(screen.getByText("kcal kaldı")).toBeTruthy();
    expect(screen.getByText("−100 kcal")).toBeTruthy();
    expect(screen.getByText("Kalori açığı · hedef 2.000")).toBeTruthy();
    expect(screen.getByTestId("calorie-balance-progress")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("calorie-balance-card"));
    expect(onPress).toHaveBeenCalled();
  });

  it("hedef asildiginda asilan miktari, profil eksikse dengeyi uydurmadan gosterir", async () => {
    const { rerender } = await render(
      <CalorieBalanceCard day={makeEnergyDay({ intakeCalories: 2300, remainingCalories: -300, balance: 400, tone: "orange" })} loading={false} error={false} onPress={jest.fn()} />,
    );
    expect(screen.getByText("300")).toBeTruthy();
    expect(screen.getByText("kcal aşıldı")).toBeTruthy();
    expect(screen.getByText("+400 kcal")).toBeTruthy();

    await rerender(
      <CalorieBalanceCard day={makeEnergyDay({ expenditureCalories: null, balance: null })} loading={false} error={false} onPress={jest.fn()} />,
    );
    expect(screen.getByText("Profil eksik")).toBeTruthy();
    expect(screen.getByText("Harcanan hesaplanamadı · hedef 2.000")).toBeTruthy();
  });

  it("hata durumunda sifir yerine tire gosterir", async () => {
    await render(<CalorieBalanceCard day={null} loading={false} error onPress={jest.fn()} />);
    expect(screen.getByText("Veri alınamadı")).toBeTruthy();
    expect(screen.queryByTestId("calorie-balance-progress")).toBeNull();
  });
});

describe("QuickStats", () => {
  it("yatay ve kartlara oturan kaydirma kullanir; aksiyon kartina dokunulabilir", () => {
    const onPress = jest.fn();
    render(
      <QuickStats
        stats={[{ id: "w", label: "Antrenman", value: "12", icon: "barbell" }]}
        actions={[{ id: "mbfit-points", label: "MB FIT Puanı", value: "1.250", icon: "trophy-outline", onPress }]}
      />,
    );
    const scroller = screen.getByTestId("quick-stats-scroller");
    expect(scroller.props.horizontal).toBe(true);
    expect(scroller.props.snapToInterval).toBeGreaterThan(0);
    fireEvent.press(screen.getByTestId("quick-stat-mbfit-points"));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("CampaignsSection", () => {
  const campaign = { id: 3, title: "Yaz", summary: "Kısa", imageUrl: null, category: "Üyelik", startAt: null, endAt: null };

  it("yukleniyor, bos ve hata durumlarini gosterir", () => {
    const { rerender } = render(<CampaignsSection campaigns={[]} loading error={false} onRetry={jest.fn()} onSelect={jest.fn()} />);
    expect(screen.getByTestId("campaigns-loading")).toBeTruthy();

    rerender(<CampaignsSection campaigns={[]} loading={false} error={false} onRetry={jest.fn()} onSelect={jest.fn()} />);
    expect(screen.getByTestId("campaigns-empty")).toBeTruthy();

    const onRetry = jest.fn();
    rerender(<CampaignsSection campaigns={[]} loading={false} error onRetry={onRetry} onSelect={jest.fn()} />);
    fireEvent.press(screen.getByTestId("campaigns-error"));
    expect(onRetry).toHaveBeenCalled();
  });

  it("kampanya kartina dokununca secer", () => {
    const onSelect = jest.fn();
    render(<CampaignsSection campaigns={[campaign]} loading={false} error={false} onRetry={jest.fn()} onSelect={onSelect} />);
    expect(screen.getByText("Yaz")).toBeTruthy();
    expect(screen.getByText("Kısa")).toBeTruthy();
    fireEvent.press(screen.getByTestId("campaign-card-3"));
    expect(onSelect).toHaveBeenCalledWith(campaign);
  });
});
