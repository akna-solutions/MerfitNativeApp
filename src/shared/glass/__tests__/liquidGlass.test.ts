import { Platform } from "react-native";

const mockLiquid = jest.fn(() => true);
const mockApi = jest.fn(() => true);
jest.mock("expo-glass-effect", () => ({
  isLiquidGlassAvailable: () => mockLiquid(),
  isGlassEffectAPIAvailable: () => mockApi(),
}));

import { isLiquidGlassSupported, resetLiquidGlassSupportCache } from "../liquidGlass";

const setOS = (os: typeof Platform.OS) => Object.defineProperty(Platform, "OS", { value: os, configurable: true });

describe("isLiquidGlassSupported", () => {
  const originalOS = Platform.OS;
  beforeEach(() => {
    resetLiquidGlassSupportCache();
    mockLiquid.mockReset().mockReturnValue(true);
    mockApi.mockReset().mockReturnValue(true);
  });
  afterAll(() => setOS(originalOS));

  it("iOS 26+ ve API mevcutken cam kullanir", () => {
    setOS("ios");
    expect(isLiquidGlassSupported()).toBe(true);
  });

  it("Android'de native modulu hic sorgulamadan fallback'e duser", () => {
    setOS("android");
    expect(isLiquidGlassSupported()).toBe(false);
    expect(mockLiquid).not.toHaveBeenCalled();
  });

  it("iOS 25 ve alti (Liquid Glass yok) fallback kullanir", () => {
    setOS("ios");
    mockLiquid.mockReturnValue(false);
    expect(isLiquidGlassSupported()).toBe(false);
  });

  it("UIGlassEffect API'si olmayan iOS 26 betalarinda fallback kullanir", () => {
    setOS("ios");
    mockApi.mockReturnValue(false);
    expect(isLiquidGlassSupported()).toBe(false);
  });

  it("native modul yoksa (yeniden derlenmemis build) cokmeden fallback'e duser", () => {
    setOS("ios");
    mockLiquid.mockImplementation(() => {
      throw new Error("Cannot find native module 'ExpoGlassEffect'");
    });
    expect(isLiquidGlassSupported()).toBe(false);
  });

  it("sonucu onbellege alir", () => {
    setOS("ios");
    isLiquidGlassSupported();
    isLiquidGlassSupported();
    expect(mockLiquid).toHaveBeenCalledTimes(1);
  });
});
