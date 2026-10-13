import { render } from "@testing-library/react-native";

import { EmailVerificationGate } from "../EmailVerificationGate";

const mockRouter = { replace: jest.fn(), canDismiss: jest.fn(() => false), dismissAll: jest.fn() };
let mockSegments: string[] = [];
let mockState = { isSignedIn: true, emailConfirmed: false as boolean | null };

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useSegments: () => mockSegments,
}));
jest.mock("../useEmailVerificationState", () => ({
  useEmailVerificationState: () => mockState,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSegments = ["pages", "dashboard"];
  mockState = { isSignedIn: true, emailConfirmed: false };
});

const verifyRoute = { pathname: "/pages/auth/verify-email", params: { code: "notSent" } };

describe("EmailVerificationGate", () => {
  it("doğrulanmamış hesabı uygulama ekranlarından kod ekranına yönlendirir", () => {
    render(<EmailVerificationGate />);
    expect(mockRouter.replace).toHaveBeenCalledWith(verifyRoute);
  });

  it.each([
    [["pages", "(tabs)", "profile"]],
    [["pages", "workouts", "123"]],
    [["pages", "profile", "edit"]],
  ])("%j ekranında da yönlendirir", (segments) => {
    mockSegments = segments;
    render(<EmailVerificationGate />);
    expect(mockRouter.replace).toHaveBeenCalledWith(verifyRoute);
  });

  it.each([
    [["pages", "auth", "verify-email"]],
    [["pages", "auth", "forgot-password"]],
    [["pages", "onboarding"]],
    [["pages", "login"]],
    [["pages", "welcome"]],
    [[]],
  ])("%j ekranında yönlendirmez", (segments) => {
    mockSegments = segments;
    render(<EmailVerificationGate />);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("doğrulanmış, durumu bilinmeyen veya oturumu olmayan kullanıcıya dokunmaz", () => {
    for (const state of [
      { isSignedIn: true, emailConfirmed: true },
      { isSignedIn: true, emailConfirmed: null },
      { isSignedIn: false, emailConfirmed: false },
    ]) {
      mockState = state;
      render(<EmailVerificationGate />);
    }
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
