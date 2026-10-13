import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ApiError } from "../../../../services/api/client";
import {
  confirmEmail,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  verifyPasswordResetCode,
} from "../../../../services/api/auth";
import { mockThemeValue } from "../../../../test/mockTheme";
import ForgotPasswordRoute from "../forgot-password";
import VerifyEmailRoute from "../verify-email";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  canDismiss: jest.fn(() => false),
  dismissAll: jest.fn(),
};
let mockParams: Record<string, string | undefined> = {};
const mockLogout = jest.fn(async () => undefined);
let mockAuthStatus = "signedOut";
let mockVerification = {
  isSignedIn: false,
  email: null as string | null,
  emailConfirmed: null as boolean | null,
  markEmailConfirmed: jest.fn(),
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));
jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("../../../../shared/auth/AuthContext", () => ({
  useAuth: () => ({ status: mockAuthStatus, logout: mockLogout }),
}));
jest.mock("../../../../shared/auth/useEmailVerificationState", () => ({
  useEmailVerificationState: () => mockVerification,
}));
jest.mock("../../../../services/api/auth", () => ({
  confirmEmail: jest.fn(),
  requestPasswordReset: jest.fn(),
  resendVerificationEmail: jest.fn(),
  resetPassword: jest.fn(),
  verifyPasswordResetCode: jest.fn(),
}));

const GENERIC = "Bu e-posta adresiyle kayıtlı bir hesap varsa şifre sıfırlama kodu gönderdik.";
const wrongCode = () => new ApiError(400, "Kod hatalı. Lütfen e-postadaki 6 haneli kodu kontrol et.", ["Kod hatalı. Lütfen e-postadaki 6 haneli kodu kontrol et."]);
const expiredCode = () => new ApiError(400, "Kodun süresi dolmuş. Yeni kod iste.", ["Kodun süresi dolmuş. Yeni kod iste."]);

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockAuthStatus = "signedOut";
  mockVerification = { isSignedIn: false, email: null, emailConfirmed: null, markEmailConfirmed: jest.fn() };
});

async function goToCodeStep() {
  (requestPasswordReset as jest.Mock).mockResolvedValue({ message: GENERIC });
  render(<ForgotPasswordRoute />);
  fireEvent.changeText(screen.getByLabelText("E-posta adresi"), "  mert@example.com ");
  fireEvent.press(screen.getByText("Kod gönder"));
  await screen.findByText("Kodu gir");
}

describe("Şifremi Unuttum", () => {
  it("geçerli e-postayla kod ister ve hesabı açığa çıkarmayan genel mesajı gösterir", async () => {
    await goToCodeStep();

    expect(screen.getByText(GENERIC)).toBeTruthy();
    expect(requestPasswordReset).toHaveBeenCalledWith("mert@example.com");
    // Bekleme süresi boyunca tekrar gönderilemez.
    expect(screen.getByText(/Kodu tekrar gönder \(/)).toBeTruthy();
  });

  it("geçersiz e-postada istek atmaz", () => {
    render(<ForgotPasswordRoute />);
    fireEvent.changeText(screen.getByLabelText("E-posta adresi"), "mert@");
    fireEvent.press(screen.getByText("Kod gönder"));
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it("servis hatasında başarılı görünmez, hatayı gösterir", async () => {
    (requestPasswordReset as jest.Mock).mockRejectedValue(new ApiError(503, "E-posta şu anda gönderilemedi."));
    render(<ForgotPasswordRoute />);
    fireEvent.changeText(screen.getByLabelText("E-posta adresi"), "mert@example.com");
    fireEvent.press(screen.getByText("Kod gönder"));

    expect(await screen.findByText("E-posta şu anda gönderilemedi.")).toBeTruthy();
    expect(screen.queryByText("Kodu gir")).toBeNull();
  });

  it("girişte yazılan e-postayı alana taşır", () => {
    mockParams = { email: "mert@example.com" };
    render(<ForgotPasswordRoute />);
    expect(screen.getByLabelText("E-posta adresi").props.value).toBe("mert@example.com");
  });

  it("hatalı kodda yeni şifre adımına geçmez", async () => {
    (verifyPasswordResetCode as jest.Mock).mockRejectedValue(wrongCode());
    await goToCodeStep();

    fireEvent.changeText(screen.getByLabelText("6 haneli kod"), "111111");
    fireEvent.press(screen.getByText("Devam et"));

    expect(await screen.findByText(/Kod hatalı/)).toBeTruthy();
    expect(screen.queryByText("Yeni şifre belirle")).toBeNull();
    expect(screen.getByLabelText("6 haneli kod").props.value).toBe("");
  });

  it("kod girişi yalnızca 6 rakam alır", async () => {
    await goToCodeStep();
    fireEvent.changeText(screen.getByLabelText("6 haneli kod"), "12 3-45a6789");
    expect(screen.getByLabelText("6 haneli kod").props.value).toBe("123456");
  });

  it("kod doğruysa yeni şifreyi kaydeder, oturumu kapatır ve girişe yönlendirir", async () => {
    mockAuthStatus = "signedIn";
    (verifyPasswordResetCode as jest.Mock).mockResolvedValue({ message: "Kod doğrulandı." });
    (resetPassword as jest.Mock).mockResolvedValue({ message: "ok" });
    await goToCodeStep();

    fireEvent.changeText(screen.getByLabelText("6 haneli kod"), "123456");
    fireEvent.press(screen.getByText("Devam et"));
    await screen.findByText("Yeni şifre belirle");
    expect(verifyPasswordResetCode).toHaveBeenCalledWith("mert@example.com", "123456");

    fireEvent.changeText(screen.getByLabelText("Yeni şifre"), "yeni-sifre");
    fireEvent.changeText(screen.getByLabelText("Yeni şifre tekrar"), "farkli");
    fireEvent.press(screen.getByText("Şifremi güncelle"));
    expect(resetPassword).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText("Yeni şifre tekrar"), "yeni-sifre");
    fireEvent.press(screen.getByText("Şifremi güncelle"));

    expect(await screen.findByText("Şifren güncellendi")).toBeTruthy();
    expect(resetPassword).toHaveBeenCalledWith({
      email: "mert@example.com",
      code: "123456",
      newPassword: "yeni-sifre",
      confirmPassword: "yeni-sifre",
    });
    expect(mockLogout).toHaveBeenCalled();
    fireEvent.press(screen.getByText("Giriş yap"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/pages/login");
  });

  it("kod bu arada geçersiz olursa kod adımına döner", async () => {
    (verifyPasswordResetCode as jest.Mock).mockResolvedValue({ message: "Kod doğrulandı." });
    (resetPassword as jest.Mock).mockRejectedValue(expiredCode());
    await goToCodeStep();
    fireEvent.changeText(screen.getByLabelText("6 haneli kod"), "123456");
    fireEvent.press(screen.getByText("Devam et"));
    await screen.findByText("Yeni şifre belirle");

    fireEvent.changeText(screen.getByLabelText("Yeni şifre"), "yeni-sifre");
    fireEvent.changeText(screen.getByLabelText("Yeni şifre tekrar"), "yeni-sifre");
    fireEvent.press(screen.getByText("Şifremi güncelle"));

    expect(await screen.findByText("Kodu gir")).toBeTruthy();
    expect(screen.getByText("Kodun süresi dolmuş. Yeni kod iste.")).toBeTruthy();
  });
});

describe("E-posta doğrulama", () => {
  const signedInUnverified = () => {
    mockVerification = { isSignedIn: true, email: "mert@example.com", emailConfirmed: false, markEmailConfirmed: jest.fn() };
  };

  it("oturum yokken girişe yönlendirir", () => {
    render(<VerifyEmailRoute />);
    expect(screen.getByText("Doğrulama kodunu almak için giriş yap.")).toBeTruthy();
    expect(resendVerificationEmail).not.toHaveBeenCalled();
  });

  it("girişten gelince bir kez kod ister; doğru kodla doğrular", async () => {
    signedInUnverified();
    (resendVerificationEmail as jest.Mock).mockResolvedValue({ alreadyVerified: false, sent: true, resendAvailableInSeconds: 60 });
    (confirmEmail as jest.Mock).mockResolvedValue({ email: "mert@example.com", emailConfirmed: true });
    const view = render(<VerifyEmailRoute />);
    view.rerender(<VerifyEmailRoute />);

    await waitFor(() => expect(resendVerificationEmail).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Kodu tekrar gönder \(/)).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText("6 haneli kod"), "123456");
    fireEvent.press(screen.getByText("Doğrula"));

    expect(await screen.findByText("E-posta adresin doğrulandı")).toBeTruthy();
    expect(confirmEmail).toHaveBeenCalledWith("123456");
    expect(mockVerification.markEmailConfirmed).toHaveBeenCalled();
  });

  it("kayıttan gelince kodu tekrar istemez ve doğrulayınca 'Hazırsın' gösterir", async () => {
    signedInUnverified();
    mockParams = { code: "sent", from: "register", name: "Mert Akpınar" };
    (confirmEmail as jest.Mock).mockResolvedValue({ email: "mert@example.com", emailConfirmed: true });
    render(<VerifyEmailRoute />);

    expect(resendVerificationEmail).not.toHaveBeenCalled();
    expect(screen.getByText(/Kodu tekrar gönder \(1:00\)/)).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText("6 haneli kod"), "654321");
    fireEvent.press(screen.getByText("Doğrula"));

    expect(await screen.findByText("Hazırsın, Mert Akpınar.")).toBeTruthy();
    fireEvent.press(screen.getByText("Antrenmana Başla"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/pages/dashboard");
  });

  it("kayıtta kod gönderilemediyse bunu söyler ve hemen tekrar göndermeye izin verir", () => {
    signedInUnverified();
    mockParams = { code: "failed" };
    render(<VerifyEmailRoute />);

    expect(screen.getByText(/Doğrulama kodu gönderilemedi/)).toBeTruthy();
    expect(screen.getByText("Kodu tekrar gönder")).toBeTruthy();
    expect(resendVerificationEmail).not.toHaveBeenCalled();
  });

  it("hatalı kodda doğrulamaz ve hatayı gösterir", async () => {
    signedInUnverified();
    mockParams = { code: "sent" };
    (confirmEmail as jest.Mock).mockRejectedValue(wrongCode());
    render(<VerifyEmailRoute />);

    fireEvent.changeText(screen.getByLabelText("6 haneli kod"), "000000");
    fireEvent.press(screen.getByText("Doğrula"));

    expect(await screen.findByText(/Kod hatalı/)).toBeTruthy();
    expect(mockVerification.markEmailConfirmed).not.toHaveBeenCalled();
    expect(screen.queryByText("E-posta adresin doğrulandı")).toBeNull();
  });

  it("atlama seçeneği yoktur; yalnızca çıkış yapılabilir", async () => {
    signedInUnverified();
    mockParams = { code: "sent" };
    render(<VerifyEmailRoute />);

    expect(screen.queryByText("Daha sonra")).toBeNull();
    expect(screen.queryByLabelText("Geri")).toBeNull();
    fireEvent.press(screen.getByText("Çıkış yap"));

    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/pages/welcome"));
  });

  it("kod az önce gönderildiyse (429) bekleme süresini gösterir, hata saymaz", async () => {
    signedInUnverified();
    (resendVerificationEmail as jest.Mock).mockRejectedValue(new ApiError(429, "Yeni bir e-posta istemeden önce biraz beklemelisin.", [], undefined, 42));
    render(<VerifyEmailRoute />);

    expect(await screen.findByText("Kodu kısa süre önce gönderdik. Gelen kutunu kontrol et.")).toBeTruthy();
    expect(screen.getByText("Kodu tekrar gönder (42 sn)")).toBeTruthy();
  });

  it("sunucu e-postanın zaten doğrulandığını söylerse devam ettirir", async () => {
    signedInUnverified();
    (resendVerificationEmail as jest.Mock).mockResolvedValue({ alreadyVerified: true, sent: false, resendAvailableInSeconds: 0 });
    render(<VerifyEmailRoute />);

    expect(await screen.findByText("E-posta adresin doğrulandı")).toBeTruthy();
    expect(mockVerification.markEmailConfirmed).toHaveBeenCalled();
  });
});
