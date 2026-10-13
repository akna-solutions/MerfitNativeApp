import { adjustRestEndsAt, remainingRestSeconds, restEndsAt } from "../restClock";

describe("dinlenme sayaci (gercek zamana dayali)", () => {
  const now = 1_000_000;

  it("kalan sureyi bitis anindan hesaplar ve yukari yuvarlar", () => {
    const endsAt = restEndsAt(60, now);
    expect(remainingRestSeconds(endsAt, now)).toBe(60);
    expect(remainingRestSeconds(endsAt, now + 200)).toBe(60);
    expect(remainingRestSeconds(endsAt, now + 1_000)).toBe(59);
    expect(remainingRestSeconds(endsAt, now + 59_001)).toBe(1);
    expect(remainingRestSeconds(endsAt, now + 60_000)).toBe(0);
  });

  it("arka planda gecen sureyi (ara tick olmadan) dogru yansitir ve negatife dusmez", () => {
    const endsAt = restEndsAt(90, now);
    expect(remainingRestSeconds(endsAt, now + 45_000)).toBe(45);
    expect(remainingRestSeconds(endsAt, now + 10 * 60_000)).toBe(0);
  });

  it("-15/+15 ayari bitis anini kaydirir; sure dolduysa simdiden uygulanir", () => {
    const endsAt = restEndsAt(30, now);
    expect(remainingRestSeconds(adjustRestEndsAt(endsAt, 15, now), now)).toBe(45);
    expect(remainingRestSeconds(adjustRestEndsAt(endsAt, -15, now), now)).toBe(15);
    expect(remainingRestSeconds(adjustRestEndsAt(endsAt, -60, now), now)).toBe(0);
    const later = now + 40_000;
    expect(remainingRestSeconds(adjustRestEndsAt(endsAt, 15, later), later)).toBe(15);
  });
});
