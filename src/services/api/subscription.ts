import { apiRequest } from "./client";
import { MySubscriptionResponse } from "./types";

/** GET /api/subscription - giris yapmis kullanicinin Plus uyeligi ve aktif planlar. */
export async function getMySubscription(signal?: AbortSignal): Promise<MySubscriptionResponse> {
  return apiRequest<MySubscriptionResponse>("/api/subscription", { signal });
}
