import { darkColors } from "../shared/theme/tokens";

/** Testlerde ThemeProvider (Auth/Profile bagimli) yerine kullanilan sabit koyu tema. */
export const mockThemeValue = {
  mode: "dark" as const,
  resolvedScheme: "dark" as const,
  colors: darkColors,
  isDark: true,
  setThemeMode: () => undefined,
};
