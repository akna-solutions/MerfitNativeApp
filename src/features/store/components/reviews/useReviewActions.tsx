import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { invalidateProductReviews } from "../../hooks";
import { storeRoutes } from "../../navigation";
import { describeError, useStore } from "../../state/StoreContext";
import { Review, ReviewImage } from "../../types";
import { ReportReviewSheet } from "./ReportReviewSheet";
import { ReviewPhotoViewer } from "./ReviewPhotoViewer";

/**
 * Yorum kartlarinin ortak islemleri (fotograf galerisi, bildir, kendi yorumunu duzenle/sil). Hem urun detayindaki
 * bolum hem tum yorumlar ekrani kullanir; `modals` ekranin icine bir kez cizilir.
 */
export function useReviewActions(productId: string, onNotice: (message: string, error?: boolean) => void) {
  const router = useRouter();
  const { services } = useStore();
  const [photos, setPhotos] = useState<{ images: ReviewImage[]; index: number } | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);

  const openPhotos = useCallback((images: ReviewImage[], index: number) => setPhotos({ images, index }), []);
  const report = useCallback((review: Review) => setReporting(review.id), []);
  const edit = useCallback(() => router.push(storeRoutes.writeReview(productId)), [router, productId]);
  const remove = useCallback(
    (review: Review) => {
      Alert.alert("Yorumu sil", "Yorumun ve fotoğrafları kalıcı olarak silinsin mi?", [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await services.reviews.remove(review.id);
              invalidateProductReviews(productId);
              onNotice("Yorumun silindi.");
            } catch (e) {
              onNotice(describeError(e, "Yorum silinemedi. Lütfen tekrar dene.").message, true);
            }
          },
        },
      ]);
    },
    [services, productId, onNotice],
  );

  const modals = (
    <>
      <ReviewPhotoViewer images={photos?.images ?? []} startIndex={photos ? photos.index : null} onClose={() => setPhotos(null)} />
      <ReportReviewSheet
        reviewId={reporting}
        onClose={() => setReporting(null)}
        onReported={(already) => {
          setReporting(null);
          invalidateProductReviews(productId);
          onNotice(already ? "Bu yorumu daha önce bildirmiştin." : "Teşekkürler, bildirimin alındı.");
        }}
      />
    </>
  );

  return { cardProps: { onOpenPhotos: openPhotos, onReport: report, onEdit: edit, onDelete: remove }, modals };
}
