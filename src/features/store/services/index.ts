import { createDummyStoreServices } from "./dummy";
import { StoreServices } from "./types";

export type * from "./types";
export { createDummyStoreServices } from "./dummy";

/**
 * Uygulamanin kullandigi servis ornegi. Backend baglanirken yalniz burasi HTTP implementasyonuyla
 * (orn. createHttpStoreServices(apiClient)) degistirilir; ekranlara dokunulmaz.
 */
export const storeServices: StoreServices = createDummyStoreServices();
