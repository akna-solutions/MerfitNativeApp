import { Campaign } from "../types";
import { PRODUCTS } from "./products";

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=60`;

type RawCampaign = Omit<Campaign, "discountPercentage">;

const RAW_CAMPAIGNS: RawCampaign[] = [
  { id: "camp-giyim", title: "Spor Giyiminde Sezon Fırsatları", description: "Seçili tişört, tayt ve termal üstlerde demo indirimler.", image: photo("photo-1518611012118-696072aa579a"), productIds: ["p-005", "p-007", "p-008", "p-016"], tint: "#0B2A5B" },
  { id: "camp-ekipman", title: "Fitness Ekipmanlarında Özel İndirim", description: "Dambıl, direnç bandı ve aksesuarlarda demo fırsatlar.", image: photo("photo-1583454110551-21f2fa2afe61"), productIds: ["p-009", "p-010", "p-013"], tint: "#122033" },
  { id: "camp-protein", title: "Protein ve Beslenme Ürünleri", description: "Whey, BCAA ve takviyelerde demo kampanya fiyatları.", image: photo("photo-1544367567-0f2fcb009e0b"), productIds: ["p-001", "p-003", "p-004", "p-023"], tint: "#10243F" },
  { id: "camp-mbfit", title: "MBFit'e Özel Fırsatlar", description: "Akıllı bileklik, masaj ve toparlanma ürünlerinde demo fırsatlar.", image: photo("photo-1571019613454-1cb2f99b2d8b"), productIds: ["p-018", "p-019", "p-024", "p-021"], tint: "#0E1A2E" },
];

/** Kampanya indirim orani, icindeki urunlerin en yuksek indiriminden turetilir (ayri sabit yazilmaz). */
export const CAMPAIGNS: Campaign[] = RAW_CAMPAIGNS.map((c) => ({
  ...c,
  discountPercentage: Math.max(0, ...c.productIds.map((id) => PRODUCTS.find((p) => p.id === id)?.discountPercentage ?? 0)),
}));
