import { apiRequest } from "./client";
import { CampaignDetail, CampaignListItem } from "./types";

/** GET /api/campaigns - su an yayinda olan kampanyalar (admin panelindeki siraya gore). */
export async function getCampaigns(signal?: AbortSignal): Promise<CampaignListItem[]> {
  return apiRequest<CampaignListItem[]>("/api/campaigns", { signal });
}

/** GET /api/campaigns/{id} - kampanya detayi; yayindan kalkmissa 404. */
export async function getCampaign(id: number, signal?: AbortSignal): Promise<CampaignDetail> {
  return apiRequest<CampaignDetail>(`/api/campaigns/${id}`, { signal });
}
