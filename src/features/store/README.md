# MB Shop (e-ticaret) modülü

MB Shop verileri **MerfitCustomerApi** `/api/store` uç noktalarından gelir (katalog, kampanyalar, sepet, favoriler,
adresler, ödeme seçenekleri, siparişler). Uygulamada dummy veri ya da sessiz yedek veri yoktur: sunucuya
ulaşılamazsa ekran hata durumu ve "Tekrar dene" gösterir. Admin işlemleri (ürün, stok, kategori, kampanya,
sipariş durumu) MerfitApi `/api/admin/store/*` üzerinden yapılır; mobil uygulamada admin yetkisi yoktur.

API adresi `EXPO_PUBLIC_API_URL` ortam değişkeninden okunur (`src/services/api/config.ts`). Tüm uçlar oturum ister;
kullanıcı kimliği JWT'den alınır, istemci kullanıcı id'si göndermez.

## Klasörler

| Klasör | İçerik |
| --- | --- |
| `../../services/api/store.ts` | `/api/store` uçları ve DTO tipleri (tek HTTP katmanı, mevcut `apiRequest` istemcisi) |
| `types/` | Ekranların kullandığı alan modelleri (`ProductSummary`, `Product`, `Cart`, `Order`, `DeliveryAddress`…) |
| `services/` | `types.ts` (servis arayüzleri), `mappers.ts` (DTO → model), `http.ts` (arayüzlerin HTTP uygulaması), `index.ts` |
| `state/` | `StoreContext.tsx`: oturuma bağlı ilk yükleme, sepet/favori/adres durumu, 401'de oturumu kapatma |
| `hooks/` | `useCart`, `useFavorites`, `useAddresses`, `useProductQuery` (sayfalı), `useOrderList` (sayfalı), `useProductDetail`, `useOrderDetail`, `useCheckoutOptions`, `useBrands` |
| `components/` | Ortak UI (ürün kartı, fiyat, adet seçici, boş durum, filtre sayfası, kampanya/kategori kartları, havale bilgisi…) |
| `screens/` | Ana sayfa, ürün listesi, ürün detay, sepet, ödeme, sipariş başarı, siparişler, sipariş detay, favoriler, adresler, kategoriler |

Rota dosyaları `src/app/pages/store/*` ve `src/app/pages/(tabs)/store*.tsx` altında ince sarmalayıcılardır.

## Kurallar

- Fiyat, indirim, kargo ve toplamlar **yalnızca sunucuda** hesaplanır; istemci sepete eklerken fiyat göndermez.
  `utils/pricing.ts` sadece biçimleme ve ürün detayındaki varyant fiyat önizlemesi içindir.
- Sepet satırı sunucuda stok ve satır başına 10 adet sınırıyla doğrulanır; stok yetmezse 409 döner ve ekran mesajı gösterir.
- Sipariş, kayıtlı adres id'si + ödeme yöntemi + idempotency anahtarı + kullanıcının gördüğü tutar (`expectedTotal`) ile
  verilir. Tutar değiştiyse sunucu 409 `PRICE_CHANGED` döner ve kullanıcı özet adımına geri döner. Ağ hatasında aynı
  anahtarla tekrar denenir, böylece çift sipariş oluşmaz.
- Ödeme durumu sipariş durumundan ayrıdır. Kart ile ödeme bir ödeme sağlayıcısı entegre edilene kadar kapalıdır;
  kapıda ödeme ve havale/EFT siparişleri "Ödeme bekleniyor" ile oluşur. Sahte "ödendi" durumu üretilmez.
- Kullanıcı yalnızca "Sipariş Alındı" durumundaki siparişi iptal edebilir; stok sunucuda geri eklenir.

## Testler

`__tests__/storeFlow.test.tsx`, ekranları `src/test/storeFakes.ts` içindeki **yalnızca teste ait** bellek içi servisle
çalıştırır (uygulama bunu kullanmaz). `__tests__/httpServices.test.ts` HTTP servislerinin doğru uçlara doğru gövdeyi
gönderdiğini ve yanıtların doğru eşlendiğini sınar.
