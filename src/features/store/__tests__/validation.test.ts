import { EMPTY_ADDRESS_FORM, hasErrors, isValidPhone, normalizePhone, validateAddress } from "../utils/validation";

const valid = { title: "Ev", fullName: "Ayşe Yılmaz", phone: "0532 123 45 67", city: "İstanbul", district: "Kadıköy", address: "Örnek Mah. Deneme Sok. No: 1" };

describe("adres dogrulama", () => {
  it("gecerli formu kabul eder", () => {
    expect(hasErrors(validateAddress(valid))).toBe(false);
  });

  it("bos formda tum alanlar icin hata verir", () => {
    expect(Object.keys(validateAddress(EMPTY_ADDRESS_FORM)).sort()).toEqual(["address", "city", "district", "fullName", "phone", "title"]);
  });

  it("ad soyadin en az iki sozcuk olmasini ister", () => {
    expect(validateAddress({ ...valid, fullName: "Ayşe" }).fullName).toBeDefined();
  });

  it("telefon bicimlerini normalize eder ve gecersizleri reddeder", () => {
    expect(normalizePhone("+90 (532) 123-45-67")).toBe("5321234567");
    expect(isValidPhone("05321234567")).toBe(true);
    expect(isValidPhone("5321234567")).toBe(true);
    expect(isValidPhone("1234567")).toBe(false);
    expect(isValidPhone("04321234567")).toBe(false);
    expect(validateAddress({ ...valid, phone: "123" }).phone).toBeDefined();
  });

  it("cok kisa acik adresi reddeder", () => {
    expect(validateAddress({ ...valid, address: "kısa" }).address).toBeDefined();
  });
});
