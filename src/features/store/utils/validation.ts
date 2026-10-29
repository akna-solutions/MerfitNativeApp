import { DeliveryAddress } from "../types";

export type AddressForm = Omit<DeliveryAddress, "id" | "isDefault">;
export type AddressErrors = Partial<Record<keyof AddressForm, string>>;

/** Turkiye cep telefonu: 05XXXXXXXXX veya 5XXXXXXXXX (bosluk, tire, parantez ve +90 tolere edilir). */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function isValidPhone(raw: string): boolean {
  return /^5\d{9}$/.test(normalizePhone(raw));
}

export function validateAddress(form: AddressForm): AddressErrors {
  const errors: AddressErrors = {};
  if (form.title.trim().length < 2) errors.title = "Adres başlığı girin (ör. Ev, İş).";
  if (form.fullName.trim().split(/\s+/).filter(Boolean).length < 2 || form.fullName.trim().length < 5) {
    errors.fullName = "Ad ve soyadınızı girin.";
  }
  if (!isValidPhone(form.phone)) errors.phone = "Geçerli bir cep telefonu girin (5XX XXX XX XX).";
  if (form.city.trim().length < 2) errors.city = "İl girin.";
  if (form.district.trim().length < 2) errors.district = "İlçe girin.";
  if (form.address.trim().length < 10) errors.address = "Açık adresi en az 10 karakterle girin.";
  return errors;
}

export function hasErrors(errors: AddressErrors): boolean {
  return Object.keys(errors).length > 0;
}

export const EMPTY_ADDRESS_FORM: AddressForm = {
  title: "",
  fullName: "",
  phone: "",
  city: "",
  district: "",
  address: "",
};
