# Store (e-ticaret) modülü

MBFit Store; backend olmadan **dummy veri + servis arayüzleri** ile uçtan uca çalışır (ürünler, kampanyalar, sepet,
favoriler, checkout, siparişler, adresler). Hiçbir ağ isteği yapılmaz ve uydurma bir API adresi yoktur.

## Klasörler

| Klasör | İçerik |
| --- | --- |
| `types/` | `Product`, `Category`, `Campaign`, `CartItem`, `Order`, `DeliveryAddress` vb. alan modelleri |
| `data/` | Dummy veriler: `products.ts` (24 ürün), `categories.ts`, `campaigns.ts`, `orders.ts`, `addresses.ts` |
| `utils/` | `pricing.ts` (tüm fiyat/toplam hesapları), `catalog.ts` (arama, filtre, sıralama, koleksiyonlar), `validation.ts` (adres doğrulama) |
| `services/` | `types.ts` (servis arayüzleri), `dummy.ts` (bellek içi implementasyon), `index.ts` (kullanılan örnek) |
| `state/` | `StoreContext.tsx`: sepet/favori/sipariş/adres durumunun tek sahibi; yalnızca servis arayüzlerini kullanır |
| `hooks/` | `useCart`, `useFavorites`, `useOrders`, `useAddresses`, `useProduct`, `useProductList` |
| `components/` | Ortak UI (ürün kartı, fiyat, adet seçici, boş durum, filtre sayfası, kampanya/kategori kartları…) |
| `screens/` | Store ana sayfa, ürün listesi (kategori/arama/filtre/sıralama), ürün detay, sepet, checkout, sipariş başarı, siparişler, sipariş detay, favoriler, adresler |

Rota dosyaları `src/app/pages/store/*` ve `src/app/pages/(tabs)/store.tsx` altında ince sarmalayıcılardır.

## Fiyat kuralları (tek kaynak: `utils/pricing.ts`)

- `discountPercentage` elle yazılmaz; `price` ve `originalPrice`'tan türetilir.
- `subtotal` = liste fiyatlarıyla toplam, `discount` = liste − güncel fiyat, `total` = `subtotal − discount + shippingCost`.
- Kargo (dummy kural): indirimli ara toplam **500 ₺** ve üzeriyse ücretsiz, altındaysa **49,90 ₺**.
- Bir üründen en fazla 10 adet ve stok kadar eklenebilir; varyantı seçilmemiş ürün sepete eklenmez.

## .NET Web API + PostgreSQL'e geçiş

Ekranlar ve hook'lar yalnızca `services/types.ts` içindeki arayüzlere (`CatalogService`, `CartService`,
`FavoriteService`, `OrderService`, `AddressService`) bağlıdır. Geçiş adımları:

1. Aynı arayüzleri HTTP ile uygulayan `createHttpStoreServices(...)` yazın (mevcut `src/services/api/client.ts` istemcisi kullanılabilir).
2. API DTO'larını `types/` içindeki modellere map'leyin. `Product.variants` / `VariantGroup` ürün varyantlarına (ör. `product_variant_groups`, `product_variant_options` tabloları), `CartItem.selectedVariant` seçilen seçenek id'lerine karşılık gelir.
3. `services/index.ts` içinde `storeServices` örneğini HTTP implementasyonuyla değiştirin. Ekranlara dokunmak gerekmez.
4. Sunucu tarafında fiyat/stok/kargo hesabı yeniden doğrulanmalıdır (`OrderService.createOrder`); bu modüldeki hesap yalnızca önizleme içindir. Gerçek ödeme entegrasyonu ayrı bir iştir; şimdiki ödeme adımı yalnızca demo/simülasyondur ve kart bilgisi toplamaz.

Sipariş numaraları, durumlar ve teslimat tahminleri yalnızca demo verisidir; gerçek kargo takibi yoktur.
