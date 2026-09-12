import { apiRequest } from "./client";
import { EquipmentListItem } from "./types";

/**
 * GET /api/equipment - anonim erisime acik (onboarding, kullanici henuz hesap
 * olusturmadan bu listeyi cekip EquipmentStep'te gosterir).
 */
export async function getEquipmentList(): Promise<EquipmentListItem[]> {
  return apiRequest<EquipmentListItem[]>("/api/equipment", {
    method: "GET",
    skipAuth: true,
  });
}
