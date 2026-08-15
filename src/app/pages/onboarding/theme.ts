// Onboarding, Welcome ekranının tasarım dilinin devamı.
// Renk kaynağı olarak welcome/theme.ts'i kullanıyoruz ki tek yerden yönetilsin
// ve iki ekran arasında hiçbir sapma olmasın.
import { colors as welcomeColors } from "../welcome/theme";

export const colors = {
  ...welcomeColors,
  cardBackground: "rgba(255,255,255,0.05)",
  cardBackgroundActive: "rgba(62,123,250,0.12)",
  cardBorderActive: "rgba(62,123,250,0.55)",
  inputBackground: "rgba(255,255,255,0.06)",
  progressTrack: "rgba(255,255,255,0.14)",
  // Floating bottom navigation (referans görseldeki koyu kapsül)
  navBackground: "#0A0C10",
  navInactive: "#8A8F98",
  navActive: "#00A8FF",
} as const;
