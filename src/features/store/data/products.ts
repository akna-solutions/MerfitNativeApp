import { Product, VariantGroup } from "../types";
import { discountPercent } from "../utils/pricing";

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=60`;
// Yalnizca birkac urunde galeri gosterimi icin kullanilir; diger urunlerde yuklenemeyen/yok gorsel yerine
// ProductImage bileseni marka/kategori yedek gorunumunu cizer.
const GYM_PHOTOS = [photo("photo-1583454110551-21f2fa2afe61"), photo("photo-1517836357463-d25dfeac3438"), photo("photo-1571019613454-1cb2f99b2d8b")];

type RawProduct = Omit<Product, "discountPercentage" | "images" | "variants" | "features" | "specs" | "tags"> &
  Partial<Pick<Product, "images" | "variants" | "features" | "specs" | "tags">>;

/** discountPercentage elle yazilmaz; tek kaynak fiyatlardir. */
function defineProduct(raw: RawProduct): Product {
  return {
    images: [],
    variants: [],
    features: [],
    specs: [],
    tags: [],
    ...raw,
    discountPercentage: discountPercent(raw.originalPrice, raw.price),
  };
}

const sizes = (outOfStock: string[] = []): VariantGroup => ({
  id: "size",
  label: "Beden",
  kind: "size",
  options: ["S", "M", "L", "XL"].map((s) => ({ id: s.toLowerCase(), label: s, inStock: !outOfStock.includes(s) })),
});

const colors = (list: [string, string, string][]): VariantGroup => ({
  id: "color",
  label: "Renk",
  kind: "color",
  options: list.map(([id, label, swatch]) => ({ id, label, swatch })),
});

export const PRODUCTS: Product[] = [
  // --- Protein ve takviyeler ---
  defineProduct({
    id: "p-001", name: "Whey Protein Tozu 2 kg - Çikolata", brand: "NutriForce",
    description: "Her porsiyonda 24 g protein içeren, hızlı emilen whey protein karışımı. Antrenman sonrası toparlanma desteği için tasarlanmıştır.",
    categoryId: "cat-protein", price: 1349.9, originalPrice: 1699.9, stock: 42, rating: 4.7, reviewCount: 1284,
    tags: ["bestseller", "protein", "recommended"],
    variants: [
      { id: "package", label: "Paket", kind: "package", options: [{ id: "1kg", label: "1 kg", priceDelta: -650 }, { id: "2kg", label: "2 kg" }, { id: "3kg", label: "3 kg", priceDelta: 520 }] },
      { id: "flavor", label: "Aroma", kind: "option", options: [{ id: "choc", label: "Çikolata" }, { id: "vanilla", label: "Vanilya" }, { id: "caramel", label: "Karamel", inStock: false }] },
    ],
    features: ["Porsiyon başına 24 g protein", "Düşük şeker", "Kolay çözünen formül"],
    specs: [{ label: "Porsiyon", value: "30 g (1 ölçek)" }, { label: "Kullanım", value: "Günde 1-2 porsiyonu 200-250 ml su veya süt ile karıştırın." }, { label: "Saklama", value: "Serin ve kuru yerde, ağzı kapalı saklayın." }],
  }),
  defineProduct({
    id: "p-002", name: "Kreatin Monohidrat 300 g", brand: "NutriForce",
    description: "Mikronize kreatin monohidrat tozu. Katkısız, aromasız ve kolay karışan yapıdadır.",
    categoryId: "cat-protein", price: 429.9, originalPrice: 429.9, stock: 87, rating: 4.8, reviewCount: 2210,
    tags: ["bestseller", "creatine"],
    variants: [{ id: "package", label: "Paket", kind: "package", options: [{ id: "300", label: "300 g" }, { id: "600", label: "600 g", priceDelta: 330 }] }],
    features: ["Aromasız", "Mikronize toz", "60 porsiyon"],
    specs: [{ label: "Porsiyon", value: "5 g" }, { label: "Kullanım", value: "Günde 1 porsiyon, bol su ile." }],
  }),
  defineProduct({
    id: "p-003", name: "BCAA 2:1:1 Şeftali Aromalı", brand: "PureLab",
    description: "Antrenman sırasında tüketilebilen, şeftali aromalı BCAA içeceği tozu.",
    categoryId: "cat-protein", price: 389.9, originalPrice: 499.9, stock: 0, rating: 4.4, reviewCount: 612,
    tags: ["discounted-pick", "recommended"],
    features: ["2:1:1 oran", "Şekersiz", "Şeftali aroması"],
    specs: [{ label: "Porsiyon", value: "10 g" }, { label: "Kullanım", value: "Antrenman öncesi veya sırasında 300 ml suya karıştırın." }],
  }),
  defineProduct({
    id: "p-004", name: "Pre-Workout Enerji Tozu 300 g", brand: "PureLab",
    description: "Antrenman öncesi odak ve enerji desteği için kafein içeren toz formül.",
    categoryId: "cat-protein", price: 549.9, originalPrice: 649.9, stock: 25, rating: 4.3, reviewCount: 407,
    tags: ["new", "recommended"],
    variants: [{ id: "flavor", label: "Aroma", kind: "option", options: [{ id: "berry", label: "Orman Meyveli" }, { id: "lemon", label: "Limon" }] }],
    features: ["Porsiyon başına 200 mg kafein", "Beta-alanin içerir"],
    specs: [{ label: "Porsiyon", value: "12 g" }, { label: "Uyarı", value: "Kafeine duyarlıysanız ve akşam saatlerinde kullanmayın." }],
  }),
  // --- Spor giyim ---
  defineProduct({
    id: "p-005", name: "Nefes Alan Antrenman Tişörtü", brand: "Velocity",
    description: "Hızlı kuruyan, nefes alabilen kumaşıyla yoğun antrenmanlar için tasarlanmış regular fit tişört.",
    categoryId: "cat-giyim", price: 299.9, originalPrice: 399.9, stock: 60, rating: 4.5, reviewCount: 873,
    tags: ["bestseller", "apparel"],
    variants: [sizes(), colors([["black", "Siyah", "#111111"], ["blue", "Mavi", "#2563EB"], ["grey", "Gri", "#6B7280"]])],
    features: ["Hızlı kuruyan kumaş", "Dikişsiz omuz", "Regular fit"],
    specs: [{ label: "Kumaş", value: "%88 polyester, %12 elastan" }, { label: "Yıkama", value: "30°C, ters çevirerek yıkayın." }],
  }),
  defineProduct({
    id: "p-006", name: "Esnek Antrenman Şortu 7\"", brand: "Velocity",
    description: "Dört yöne esneyen kumaşı ve cepli yapısıyla koşu ve ağırlık antrenmanı için uygun şort.",
    categoryId: "cat-giyim", price: 349.9, originalPrice: 349.9, stock: 48, rating: 4.4, reviewCount: 356,
    tags: ["new", "apparel"],
    variants: [sizes(["XL"]), colors([["black", "Siyah", "#111111"], ["navy", "Lacivert", "#1E3A8A"]])],
    features: ["Fermuarlı cep", "Yansıtıcı detay", "7 inç boy"],
    specs: [{ label: "Kumaş", value: "%92 polyester, %8 elastan" }],
  }),
  defineProduct({
    id: "p-007", name: "Termal Uzun Kollu Antrenman Üstü", brand: "Arctis",
    description: "Soğuk havalarda ısıyı koruyan, içi hafif tüylü uzun kollu üst.",
    categoryId: "cat-giyim", price: 449.9, originalPrice: 649.9, stock: 30, rating: 4.6, reviewCount: 241,
    tags: ["apparel", "recommended"],
    variants: [sizes(["S"]), colors([["black", "Siyah", "#111111"], ["grey", "Gri", "#6B7280"]])],
    features: ["Isı koruyucu iç yüzey", "Başparmak delikli manşet"],
    specs: [{ label: "Kumaş", value: "%90 polyester, %10 elastan" }],
  }),
  defineProduct({
    id: "p-008", name: "Yüksek Bel Sporcu Taytı", brand: "Arctis",
    description: "Sıkı sarmalayan, yüksek belli ve opak kumaşlı spor tayt.",
    categoryId: "cat-giyim", price: 399.9, originalPrice: 499.9, stock: 36, rating: 4.7, reviewCount: 968,
    tags: ["bestseller", "apparel", "recommended"],
    variants: [sizes(), colors([["black", "Siyah", "#111111"], ["blue", "Mavi", "#2563EB"]])],
    features: ["Opak kumaş", "Gizli anahtar cebi", "Yüksek bel"],
    specs: [{ label: "Kumaş", value: "%78 naylon, %22 elastan" }],
  }),
  // --- Ekipman ---
  defineProduct({
    id: "p-009", name: "Neopren Kaplı Dambıl Seti 2x5 kg", brand: "IronPeak",
    description: "Kaymaz neopren kaplamalı, ev antrenmanları için çift dambıl seti.",
    images: GYM_PHOTOS, categoryId: "cat-ekipman", price: 899.9, originalPrice: 1099.9, stock: 18, rating: 4.6, reviewCount: 534,
    tags: ["bestseller", "equipment", "recommended"],
    variants: [{ id: "weight", label: "Ağırlık", kind: "option", options: [{ id: "2x2", label: "2 x 2 kg", priceDelta: -420 }, { id: "2x5", label: "2 x 5 kg" }, { id: "2x8", label: "2 x 8 kg", priceDelta: 380 }, { id: "2x10", label: "2 x 10 kg", priceDelta: 640, inStock: false }] }],
    features: ["Neopren kaplama", "Altıgen gövde: yuvarlanmaz", "Çift olarak satılır"],
    specs: [{ label: "Malzeme", value: "Çelik çekirdek, neopren kaplama" }, { label: "Kullanım", value: "Ağırlığı kontrollü kaldırın, zemine bırakmayın." }],
  }),
  defineProduct({
    id: "p-010", name: "Direnç Bandı Seti (5 Seviye)", brand: "IronPeak",
    description: "Beş farklı direnç seviyesine sahip, doğal lateks bant seti. Taşıma çantası ile birlikte gelir.",
    images: GYM_PHOTOS.slice(1), categoryId: "cat-ekipman", price: 249.9, originalPrice: 329.9, stock: 74, rating: 4.5, reviewCount: 1190,
    tags: ["bestseller", "equipment", "new"],
    features: ["5 direnç seviyesi", "Taşıma çantalı", "Doğal lateks"],
    specs: [{ label: "Direnç", value: "5 - 40 kg" }, { label: "İçerik", value: "5 bant, kapı çapası, 2 kulp, 2 ayak bileği kayışı" }],
  }),
  defineProduct({
    id: "p-011", name: "Ayarlanabilir Kettlebell 4-12 kg", brand: "IronPeak",
    description: "Tek ekipmanla birden fazla ağırlığı kullanmanıza izin veren ayarlanabilir kettlebell.",
    categoryId: "cat-ekipman", price: 1799.9, originalPrice: 1799.9, stock: 9, rating: 4.2, reviewCount: 88,
    tags: ["equipment", "new"],
    features: ["4 kademe ağırlık", "Kolay ayar mekanizması"],
    specs: [{ label: "Ağırlık aralığı", value: "4 / 6 / 8 / 12 kg" }],
  }),
  defineProduct({
    id: "p-012", name: "Kalın Yoga ve Pilates Matı", brand: "ZenMove",
    description: "15 mm kalınlığında, kaymaz yüzeyli ve taşıma kayışlı mat.",
    categoryId: "cat-ekipman", price: 359.9, originalPrice: 359.9, stock: 55, rating: 4.4, reviewCount: 422,
    tags: ["equipment", "wellness"],
    variants: [colors([["blue", "Mavi", "#2563EB"], ["black", "Siyah", "#111111"], ["grey", "Gri", "#6B7280"]])],
    features: ["15 mm kalınlık", "Kaymaz yüzey", "Taşıma kayışı"],
    specs: [{ label: "Ölçü", value: "183 x 61 cm" }],
  }),
  defineProduct({
    id: "p-013", name: "Atlama İpi - Ayarlanabilir Hız İpi", brand: "Velocity",
    description: "Rulmanlı kulpları ve ayarlanabilir kablosuyla kardiyo antrenmanları için hız ipi.",
    categoryId: "cat-ekipman", price: 139.9, originalPrice: 189.9, stock: 120, rating: 4.3, reviewCount: 305,
    tags: ["equipment", "new", "recommended"],
    features: ["Rulmanlı kulp", "Ayarlanabilir uzunluk"],
    specs: [{ label: "Uzunluk", value: "280 cm (kısaltılabilir)" }],
  }),
  // --- Aksesuarlar ---
  defineProduct({
    id: "p-014", name: "Karıştırıcılı Shaker 700 ml", brand: "NutriForce",
    description: "Paslanmaz karıştırma topu ve sızdırmaz kapağıyla protein shaker'ı.",
    categoryId: "cat-aksesuar", price: 129.9, originalPrice: 129.9, stock: 200, rating: 4.6, reviewCount: 2034,
    tags: ["bestseller", "accessory"],
    variants: [colors([["black", "Siyah", "#111111"], ["blue", "Mavi", "#2563EB"], ["clear", "Şeffaf", "#E5E7EB"]])],
    features: ["Sızdırmaz kapak", "BPA içermez", "Bulaşık makinesinde yıkanabilir"],
    specs: [{ label: "Hacim", value: "700 ml" }],
  }),
  defineProduct({
    id: "p-015", name: "Paslanmaz Çelik Termos Matara 750 ml", brand: "ZenMove",
    description: "Çift cidarlı yalıtımıyla suyu 24 saate kadar soğuk tutan matara.",
    categoryId: "cat-aksesuar", price: 279.9, originalPrice: 349.9, stock: 64, rating: 4.7, reviewCount: 760,
    tags: ["accessory", "wellness", "recommended"],
    variants: [colors([["black", "Siyah", "#111111"], ["blue", "Mavi", "#2563EB"]])],
    features: ["24 saat soğuk", "Sızdırmaz kapak"],
    specs: [{ label: "Hacim", value: "750 ml" }, { label: "Malzeme", value: "304 paslanmaz çelik" }],
  }),
  defineProduct({
    id: "p-016", name: "Spor Çantası 35 L", brand: "Velocity",
    description: "Ayakkabı bölmeli, ıslak eşya gözlü ve su itici kumaşlı spor çantası.",
    categoryId: "cat-aksesuar", price: 599.9, originalPrice: 799.9, stock: 22, rating: 4.5, reviewCount: 298,
    tags: ["accessory", "new"],
    variants: [colors([["black", "Siyah", "#111111"], ["navy", "Lacivert", "#1E3A8A"]])],
    features: ["Ayakkabı bölmesi", "Islak eşya gözü", "Su itici kumaş"],
    specs: [{ label: "Hacim", value: "35 L" }],
  }),
  defineProduct({
    id: "p-017", name: "Antrenman Eldiveni", brand: "IronPeak",
    description: "Avuç içi destekli, nefes alan antrenman eldiveni.",
    categoryId: "cat-aksesuar", price: 199.9, originalPrice: 199.9, stock: 0, rating: 4.1, reviewCount: 144,
    tags: ["accessory"],
    variants: [{ id: "size", label: "Beden", kind: "size", options: ["S", "M", "L"].map((s) => ({ id: s.toLowerCase(), label: s })) }],
    features: ["Avuç içi destek", "Kaymaz yüzey"],
    specs: [{ label: "Kumaş", value: "Sentetik deri, file" }],
  }),
  // --- Teknoloji ---
  defineProduct({
    id: "p-018", name: "Akıllı Bileklik Fit Band 5", brand: "PulseTek",
    description: "Kalp atış hızı, adım ve uyku takibi yapan 14 gün pil ömürlü akıllı bileklik.",
    categoryId: "cat-teknoloji", price: 1249.9, originalPrice: 1599.9, stock: 33, rating: 4.4, reviewCount: 1021,
    tags: ["bestseller", "tech", "recommended"],
    variants: [colors([["black", "Siyah", "#111111"], ["blue", "Mavi", "#2563EB"]])],
    features: ["14 gün pil", "Kalp atış hızı takibi", "5 ATM suya dayanıklılık"],
    specs: [{ label: "Ekran", value: "1.47\" AMOLED" }, { label: "Uyumluluk", value: "iOS ve Android" }],
  }),
  defineProduct({
    id: "p-019", name: "Spor Akıllı Saat GPS", brand: "PulseTek",
    description: "Dahili GPS'li, çoklu spor modlu akıllı saat.",
    categoryId: "cat-teknoloji", price: 3299.9, originalPrice: 3799.9, stock: 12, rating: 4.6, reviewCount: 389,
    tags: ["tech", "new"],
    variants: [colors([["black", "Siyah", "#111111"], ["grey", "Gri", "#6B7280"]])],
    features: ["Dahili GPS", "100+ spor modu", "10 gün pil"],
    specs: [{ label: "Ekran", value: "1.4\" AMOLED" }, { label: "Dayanıklılık", value: "5 ATM" }],
  }),
  defineProduct({
    id: "p-020", name: "Kablosuz Spor Kulaklık", brand: "PulseTek",
    description: "Kulak kancalı, ter ve suya dayanıklı kablosuz kulaklık.",
    categoryId: "cat-teknoloji", price: 799.9, originalPrice: 799.9, stock: 46, rating: 4.3, reviewCount: 512,
    tags: ["tech", "recommended"],
    variants: [colors([["black", "Siyah", "#111111"], ["blue", "Mavi", "#2563EB"]])],
    features: ["IPX5", "8 saat çalma süresi", "Bluetooth 5.3"],
    specs: [{ label: "Pil", value: "8 saat + 24 saat kutu" }],
  }),
  // --- Saglikli yasam ---
  defineProduct({
    id: "p-021", name: "Köpük Masaj Rulosu", brand: "ZenMove",
    description: "Antrenman sonrası kas gevşetme için orta sertlikte köpük rulo.",
    categoryId: "cat-saglik", price: 219.9, originalPrice: 279.9, stock: 70, rating: 4.5, reviewCount: 640,
    tags: ["wellness", "new"],
    features: ["Orta sertlik", "Yivli yüzey"],
    specs: [{ label: "Ölçü", value: "33 cm" }],
  }),
  defineProduct({
    id: "p-022", name: "Multivitamin ve Mineral 90 Tablet", brand: "PureLab",
    description: "Günlük vitamin ve mineral ihtiyacını destekleyen takviye edici gıda.",
    categoryId: "cat-saglik", price: 249.9, originalPrice: 249.9, stock: 95, rating: 4.4, reviewCount: 733,
    tags: ["wellness", "bestseller"],
    variants: [{ id: "package", label: "Paket", kind: "package", options: [{ id: "90", label: "90 tablet" }, { id: "180", label: "180 tablet", priceDelta: 190 }] }],
    features: ["24 vitamin ve mineral", "Günde 1 tablet"],
    specs: [{ label: "Uyarı", value: "Takviye edici gıdalar dengeli beslenmenin yerini tutmaz." }],
  }),
  defineProduct({
    id: "p-023", name: "Omega-3 Balık Yağı 120 Kapsül", brand: "PureLab",
    description: "EPA ve DHA içeren omega-3 balık yağı kapsülü.",
    categoryId: "cat-saglik", price: 329.9, originalPrice: 399.9, stock: 58, rating: 4.6, reviewCount: 455,
    tags: ["wellness", "recommended"],
    features: ["EPA ve DHA", "Kokusuz kapsül"],
    specs: [{ label: "Kullanım", value: "Günde 2 kapsül, yemekle birlikte." }],
  }),
  defineProduct({
    id: "p-024", name: "Masaj Tabancası Mini", brand: "ZenMove",
    description: "4 başlıklı, sessiz motorlu taşınabilir masaj tabancası.",
    categoryId: "cat-saglik", price: 899.9, originalPrice: 1199.9, stock: 15, rating: 4.5, reviewCount: 267,
    tags: ["wellness", "tech", "new"],
    features: ["4 başlık", "5 hız kademesi", "USB-C şarj"],
    specs: [{ label: "Pil", value: "6 saat" }],
  }),
];

export const PRODUCTS_BY_ID: ReadonlyMap<string, Product> = new Map(PRODUCTS.map((p) => [p.id, p]));
