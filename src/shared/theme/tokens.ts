/**
 * Merkezi semantic theme token'lari. Mevcut Merfit tasarim dili (mavi/siyah/beyaz/koyu gri,
 * mor aksan) buradan turetilir; onceki hardcoded degerler (bkz. app/pages/welcome/theme.ts,
 * app/pages/onboarding/theme.ts) `dark` paletine birebir tasindi ki gorunumde bir sapma olmasin.
 */
export type ResolvedScheme = "light" | "dark";

export type ThemeTokens = {
  background: string;
  surface: string;
  card: string;
  cardActive: string;
  text: string;
  textSecondary: string;
  border: string;
  borderActive: string;
  primary: string;
  primaryPressed: string;
  accent: string;
  /**
   * Yikici (destructive) eylemler icin semantic renk seti (orn. "Çıkış Yap", hesap silme).
   * Uygulama genelinde hata durumlarinda zaten kullanilan #FF6B6B (bkz. LoginScreen/AccountStep
   * errorText, PersonalizationPendingState badge) ile gorsel olarak tutarli tutulur.
   */
  danger: string;
  dangerPressed: string;
  dangerBackground: string;
  dangerBorder: string;
  icon: string;
  iconActive: string;
  inputBackground: string;
  progressTrack: string;
};

export const darkColors: ThemeTokens = {
  background: "#050507",
  surface: "#0A0C10",
  card: "rgba(255,255,255,0.05)",
  cardActive: "rgba(62,123,250,0.12)",
  text: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.62)",
  border: "rgba(255,255,255,0.22)",
  borderActive: "rgba(62,123,250,0.55)",
  primary: "#3E7BFA",
  primaryPressed: "#1d51c0",
  accent: "#8B5CF6",
  danger: "#FF6B6B",
  dangerPressed: "#E14F4F",
  dangerBackground: "rgba(255,107,107,0.12)",
  dangerBorder: "rgba(255,107,107,0.35)",
  icon: "#8A8F98",
  iconActive: "#00A8FF",
  inputBackground: "rgba(255,255,255,0.06)",
  progressTrack: "rgba(255,255,255,0.14)",
};

export const lightColors: ThemeTokens = {
  background: "#F5F6F8",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  cardActive: "rgba(62,123,250,0.08)",
  text: "#0B0D12",
  textSecondary: "rgba(11,13,18,0.6)",
  border: "rgba(11,13,18,0.12)",
  borderActive: "rgba(62,123,250,0.55)",
  primary: "#1d51c0",
  primaryPressed: "#153e94",
  accent: "#8B5CF6",
  danger: "#DC2626",
  dangerPressed: "#B91C1C",
  dangerBackground: "rgba(220,38,38,0.08)",
  dangerBorder: "rgba(220,38,38,0.35)",
  icon: "#6B7280",
  iconActive: "#1d51c0",
  inputBackground: "rgba(11,13,18,0.04)",
  progressTrack: "rgba(11,13,18,0.10)",
};

export function tokensFor(scheme: ResolvedScheme): ThemeTokens {
  return scheme === "light" ? lightColors : darkColors;
}
