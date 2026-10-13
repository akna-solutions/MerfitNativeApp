import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ApiError } from "../../../../services/api/client";
import {
  confirmEmail,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  validatePasswordResetToken,
} from "../../../../services/api/auth";
import { mockThemeValue } from "../../../../test/mockTheme";
import ForgotPasswordRoute from "../forgot-password";
import ResetPasswordRoute from "../reset-password";
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
  validatePasswordResetToken: jest.fn(),
}));

const TOKEN = "A".repeat(43);
const GENERIC = "Bu e-posta adresiyle kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderdik.";
const invalidLink = () => new ApiError(400, "Bağlantının süresi dolmuş. Yeni bir bağlantı iste.", ["Bağlantının süresi dolmuş. Yeni bir bağlantı iste."]);

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockAuthStatus = "signedOut";
  mockVerification = { isSignedIn: false, email: null, emailConfirmed: null, markEmailConfirmed: jest.fn() };
});

describe("Şifremi Unuttum", () => {
  it("geçerli e-postayla bağlantı ister ve hesabı açığa çıkarmayan genel mesajı gösterir", async () => {
    (requestPasswordReset as jest.Mock).mockResolvedValue({ message: GENERIC });
    render(<ForgotPasswordRoute />);

    fireEvent.changeText(screen.getByLabelText("E-posta adresi"), "  mert@example.com ");
    fireEvent.press(screen.getByText("Bağlantı gönder"));

    expect(await screen.findByText("E-postanı kontrol et")).toBeTruthy();
    expect(screen.getByText(GENERIC)).toBeTruthy();
    expect(requestPasswordReset).toHaveBeenCalledWith("mert@example.com");
    // Bekleme süresi boyunca tekrar gönderilemez.
    expect(screen.getByText(/Tekrar gönder \(/)).toBeTruthy();
  });

  it("geçersiz e-postada istek atmaz", () => {
    render(<ForgotPasswordRoute />);
    fireEvent.changeText(screen.getByLabelText("E-posta adresi"), "mert");
    fireEvent.press(screen.getByText("Bağlantı gönder"));
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it("servis hatasında başarılı görünmez, hatayı gösterir", async () => {
    (requestPasswordReset as jest.Mock).mockRejectedValue(new ApiError(503, "E-posta servisi henüz yapılandırılmadı. Lütfen daha sonra tekrar dene."));
    render(<ForgotPasswordRoute />);

    fireEvent.changeText(screen.getByLabelText("E-posta adresi"), "mert@example.com");
    fireEvent.press(screen.getByText("Bağlantı gönder"));

    expect(await screen.findByText(/henüz yapılandırılmadı/)).toBeTruthy();
    expect(screen.queryByText("E-postanı kontrol et")).toBeNull();
  });

  it("girişte yazılan e-postayı alana taşır", () => {
    mockParams = { email: "mert@example.com" };
    render(<ForgotPasswordRoute />);
    expect(screen.getByLabelText("E-posta adresi").props.value).toBe("mert@example.com");
  });
});

describe("Yeni Şifre Belirleme", () => {
  it("bağlantısız açılınca anlaşılır hata ve yeni bağlantı isteme sunar", () => {
    render(<ResetPasswordRoute />);
    expect(screen.getByText("Bağlantı kullanılamıyor")).toBeTruthy();
    fireEvent.press(screen.getByText("Yeni bağlantı iste"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/pages/auth/forgot-password");
    expect(validatePasswordResetToken).not.toHaveBeenCalled();
  });

  it("süresi dolmuş bağlantıda formu göstermez", async () => {
    mockParams = { token: TOKEN };
    (validatePasswordResetToken as jest.Mock).mockRejectedValue(invalidLink());
    render(<ResetPasswordRoute />);

    expect(await screen.findByText("Bağlantı kullanılamıyor")).toBeTruthy();
    expect(screen.getByText(/süresi dolmuş/)).toBeTruthy();
    expect(screen.queryByLabelText("Yeni şifre")).toBeNull();
  });

  it("kurallar sağlanana kadar göndermez; başarıda oturumu kapatır ve girişe yönlendirir", async () => {
    mockParams = { token: TOKEN };
    mockAuthStatus = "signedIn";
    (validatePasswordResetToken as jest.Mock).mockResolvedValue({ message: "ok" });
    (resetPassword as jest.Mock).mockResolvedValue({ message: "ok" });
    render(<ResetPasswordRoute />);

    const password = await screen.findByLabelText("Yeni şifre");
    fireEvent.changeText(password, "yeni-sifre");
    fireEvent.changeText(screen.getByLabelText("Yeni şifre tekrar"), "farkli");
    fireEvent.press(screen.getByText("Şifremi güncelle"));
    expect(resetPassword).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Şifreler eşleşiyor: eksik")).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText("Yeni şifre tekrar"), "yeni-sifre");
    expect(screen.getByLabelText("Şifreler eşleşiyor: tamam")).toBeTruthy();
    fireEvent.press(screen.getByText("Şifremi güncelle"));

    expect(await screen.findByText("Şifren güncellendi")).toBeTruthy();
    expect(resetPassword).toHaveBeenCalledWith({ token: TOKEN, newPassword: "yeni-sifre", confirmPassword: "yeni-sifre" });
    expect(mockLogout).toHaveBeenCalled();
    fireEvent.press(screen.getByText("Giriş yap"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/pages/login");
  });

  it("aynı bağlantı tekrar kullanılırsa hata ekranına geçer", async () => {
    mockParams = { token: TOKEN };
    (validatePasswordResetToken as jest.Mock).mockResolvedValue({ message: "ok" });
    (resetPassword as jest.Mock).mockRejectedValue(new ApiError(400, "Bağlantı geçersiz veya daha önce kullanılmış. Yeni bir bağlantı iste.", ["x"]));
    render(<ResetPasswordRoute />);

    fireEvent.changeText(await screen.findByLabelText("Yeni şifre"), "yeni-sifre");
    fireEvent.changeText(screen.getByLabelText("Yeni şifre tekrar"), "yeni-sifre");
    fireEvent.press(screen.getByText("Şifremi güncelle"));

    expect(await screen.findByText(/daha önce kullanılmış/)).toBeTruthy();
    expect(screen.getByText("Yeni bağlantı iste")).toBeTruthy();
  });
});

describe("E-posta Doğrulama", () => {
  it("bağlantıyla açılınca jetonu bir kez gönderir ve başarıyı gösterir", async () => {
    mockParams = { token: TOKEN };
    mockVerification = { isSignedIn: true, email: "mert@example.com", emailConfirmed: false, markEmailConfirmed: jest.fn() };
    (confirmEmail as jest.Mock).mockResolvedValue({ email: "mert@example.com", emailConfirmed: true });
    const view = render(<VerifyEmailRoute />);

    expect(await screen.findByText("E-posta adresin doğrulandı")).toBeTruthy();
    view.rerender(<VerifyEmailRoute />);
    expect(confirmEmail).toHaveBeenCalledTimes(1);
    expect(confirmEmail).toHaveBeenCalledWith(TOKEN);
    expect(mockVerification.markEmailConfirmed).toHaveBeenCalled();
    fireEvent.press(screen.getByText("Uygulamaya devam et"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/pages/dashboard");
  });

  it("geçersiz bağlantıda hatayı ve yeniden gönderme seçeneğini gösterir", async () => {
    mockParams = { token: TOKEN };
    mockVerification = { isSignedIn: true, email: "mert@example.com", emailConfirmed: false, markEmailConfirmed: jest.fn() };
    (confirmEmail as jest.Mock).mockRejectedValue(invalidLink());
    render(<VerifyEmailRoute />);

    expect(await screen.findByText("E-posta doğrulanamadı")).toBeTruthy();
    expect(screen.getByText(/süresi dolmuş/)).toBeTruthy();
    expect(screen.getByText("Doğrulama e-postasını tekrar gönder")).toBeTruthy();
    expect(mockVerification.markEmailConfirmed).not.toHaveBeenCalled();
  });

  it("oturum yokken geçersiz bağlantıda girişe yönlendirir", async () => {
    mockParams = { token: TOKEN };
    (confirmEmail as jest.Mock).mockRejectedValue(invalidLink());
    render(<VerifyEmailRoute />);

    expect(await screen.findByText(/giriş yap; uygulama/)).toBeTruthy();
    fireEvent.press(screen.getByText("Giriş yap"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/pages/login");
  });

  it("bekleyen durumda tekrar gönderir, bekleme süresini ve hız sınırını gösterir", async () => {
    mockVerification = { isSignedIn: true, email: "mert@example.com", emailConfirmed: false, markEmailConfirmed: jest.fn() };
    (resendVerificationEmail as jest.Mock)
      .mockResolvedValueOnce({ alreadyVerified: false, sent: true, resendAvailableInSeconds: 60 });
    render(<VerifyEmailRoute />);

    expect(screen.getByText("mert@example.com")).toBeTruthy();
    fireEvent.press(screen.getByText("Doğrulama e-postasını tekrar gönder"));

    expect(await screen.findByText(/Yeni doğrulama bağlantısını gönderdik/)).toBeTruthy();
    expect(screen.getByText("Tekrar gönder (1:00)")).toBeTruthy();
    // Bekleme süresinde buton çalışmaz.
    fireEvent.press(screen.getByText("Tekrar gönder (1:00)"));
    expect(resendVerificationEmail).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText("Daha sonra"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/pages/dashboard");
  });

  it("sunucu 429 dönerse Retry-After kadar bekletir", async () => {
    jest.useFakeTimers();
    try {
      mockVerification = { isSignedIn: true, email: "mert@example.com", emailConfirmed: false, markEmailConfirmed: jest.fn() };
      (resendVerificationEmail as jest.Mock).mockRejectedValue(
        new ApiError(429, "Yeni bir e-posta istemeden önce biraz beklemelisin.", [], undefined, 5),
      );
      render(<VerifyEmailRoute />);

      fireEvent.press(screen.getByText("Doğrulama e-postasını tekrar gönder"));
      expect(await screen.findByText("Yeni bir e-posta istemeden önce biraz beklemelisin.")).toBeTruthy();
      expect(screen.getByText("Tekrar gönder (5 sn)")).toBeTruthy();

      for (let i = 0; i < 5; i++) {
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }
      await waitFor(() => expect(screen.getByText("Doğrulama e-postasını tekrar gönder")).toBeTruthy());
    } finally {
      jest.useRealTimers();
    }
  });
});
