/**
 * Yeni sifre kurallari. Backend'deki RegisterRequest.Password / ResetPasswordRequest.NewPassword
 * dogrulamasiyla (6-100 karakter) birebir ayni tutulur; kayit ekranindaki minimum 6 karakter kuraliyla da tutarli.
 */
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 100;

export type PasswordRule = { key: string; label: string; met: boolean };

export function getPasswordRules(password: string, confirmPassword: string): PasswordRule[] {
  return [
    {
      key: "length",
      label: `En az ${PASSWORD_MIN_LENGTH} karakter`,
      met: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
    },
    {
      key: "match",
      label: "Şifreler eşleşiyor",
      met: password.length > 0 && password === confirmPassword,
    },
  ];
}

export function isNewPasswordValid(password: string, confirmPassword: string): boolean {
  return getPasswordRules(password, confirmPassword).every((rule) => rule.met);
}
