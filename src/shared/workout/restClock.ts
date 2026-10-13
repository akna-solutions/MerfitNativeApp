/**
 * Dinlenme sayaci icin gercek zamana dayali hesap. Sayac "her saniye 1 azalt" yerine bir bitis anina
 * (epoch ms) gore hesaplanir; boylece JS thread'i mesgulken (orn. mini oyun calisirken) yavaslamaz,
 * uygulama arka plandan dondugunde gecen sure dogru yansir ve kac kez yeniden render edilirse edilsin
 * tek bir kaynaktan okunur.
 */

/** Kalan sureden bitis anini hesaplar. */
export function restEndsAt(remainingSec: number, nowMs: number): number {
  return nowMs + Math.max(0, remainingSec) * 1000;
}

/** Ekranda gosterilecek kalan saniye (yukari yuvarlanir: 29.2 sn -> 30). */
export function remainingRestSeconds(endsAtMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((endsAtMs - nowMs) / 1000));
}

/**
 * -15/+15 ayari. Sure zaten dolduysa ayar "simdi"den uygulanir (0'dan +15 -> 15 sn); bitis ani
 * hicbir zaman gecmise cekilmez.
 */
export function adjustRestEndsAt(endsAtMs: number, deltaSec: number, nowMs: number): number {
  return Math.max(nowMs, Math.max(endsAtMs, nowMs) + deltaSec * 1000);
}
