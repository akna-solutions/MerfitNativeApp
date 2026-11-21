import { act, render, screen } from "@testing-library/react-native";

import { BrandSplash, SPLASH_BADGE, SPLASH_TAGLINE } from "../BrandSplash";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-splash-screen", () => ({ hideAsync: jest.fn(() => Promise.resolve()) }));
jest.mock("../../motion/useReducedMotion", () => ({ useReducedMotion: () => true }));

describe("BrandSplash", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("slogan ve rozeti gosterir, uygulama hazir olana kadar kapanmaz", async () => {
    const onFinish = jest.fn();
    const { rerender } = await render(<BrandSplash ready={false} onFinish={onFinish} />);
    expect(screen.getByText(SPLASH_TAGLINE)).toBeTruthy();
    expect(screen.getByText(SPLASH_BADGE)).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(onFinish).not.toHaveBeenCalled();

    await rerender(<BrandSplash ready onFinish={onFinish} />);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("uygulama hic hazir olmasa da guvenlik suresinden sonra kapanir", async () => {
    const onFinish = jest.fn();
    await render(<BrandSplash ready={false} onFinish={onFinish} />);
    await act(async () => {
      jest.advanceTimersByTime(8100);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
