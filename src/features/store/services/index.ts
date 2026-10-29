import { createHttpStoreServices } from "./http";
import { StoreServices } from "./types";

export type * from "./types";
export { createHttpStoreServices } from "./http";

/** Uygulamanin kullandigi servisler: MerfitCustomerApi (/api/store). Adres EXPO_PUBLIC_API_URL ile belirlenir. */
export const storeServices: StoreServices = createHttpStoreServices();
