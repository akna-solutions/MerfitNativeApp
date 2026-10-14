import type { GoogleProfile } from "../../services/api/types";

/**
 * Google ile giris denendi ama hesap yoksa: kullanici onboarding'i doldururken Google kimligi bellekte tutulur
 * (diske yazilmaz). Onboarding'in son adiminda POST /api/auth/google/register bu token'la cagrilir.
 */
export type PendingGoogleSignup = {
  idToken: string;
  profile: GoogleProfile;
};

let pending: PendingGoogleSignup | null = null;

export function setPendingGoogleSignup(value: PendingGoogleSignup): void {
  pending = value;
}

export function getPendingGoogleSignup(): PendingGoogleSignup | null {
  return pending;
}

export function clearPendingGoogleSignup(): void {
  pending = null;
}
