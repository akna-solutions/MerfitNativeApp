import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme } from "../../../shared/theme/ThemeContext";
import { EmptyState } from "../components/EmptyState";
import { RatingInput } from "../components/reviews/RatingStars";
import { GUTTER } from "../components/StoreSections";
import { StoreScreenShell } from "../components/StoreScreenShell";
import { invalidateProductReviews, useMyReview, useProductDetail, useReviewSummary } from "../hooks";
import { describeError, useStore } from "../state/StoreContext";
import { Review, ReviewImage } from "../types";
import {
  MAX_COMMENT_LENGTH,
  MAX_REVIEW_PHOTOS,
  MAX_TITLE_LENGTH,
  MIN_COMMENT_LENGTH,
  PickedPhoto,
  pickReviewPhotos,
  prepareReviewPhoto,
  validateReview,
} from "../utils/reviewPhoto";

type Errors = ReturnType<typeof validateReview> & { form?: string };

/**
 * Yorum yaz / duzenle. Kullanicinin aktif yorumu varsa form onunla dolar ve kaydetme guncelleme yapar (urun basina tek
 * aktif yorum). Fotograflar yorum kaydedildikten sonra tek tek yuklenir; onayli alisveris rozetine sunucu karar verir.
 */
export function WriteReviewScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const id = typeof productId === "string" ? productId : undefined;
  const router = useRouter();
  const { colors } = useTheme();
  const { services } = useStore();
  const { product } = useProductDetail(id);
  const { summary } = useReviewSummary(id);
  const mine = useMyReview(id);

  const [saved, setSaved] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [existing, setExisting] = useState<ReviewImage[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [added, setAdded] = useState<PickedPhoto[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || mine.isLoading || mine.error) return;
    initialized.current = true;
    if (mine.review) {
      setSaved(mine.review);
      setRating(mine.review.rating);
      setTitle(mine.review.title ?? "");
      setComment(mine.review.comment);
      setExisting(mine.review.images);
    }
  }, [mine.isLoading, mine.error, mine.review]);

  const keptExisting = existing.filter((i) => !removed.includes(i.id));
  const photoCount = keptExisting.length + added.length;
  const remaining = MAX_REVIEW_PHOTOS - photoCount;
  const editing = Boolean(saved);
  const commentLength = comment.trim().length;

  const addPhotos = async (source: "camera" | "library") => {
    if (remaining <= 0) return;
    const result = await pickReviewPhotos(source, remaining);
    if (result.status === "denied") {
      setErrors((e) => ({ ...e, form: source === "camera" ? "Kamera izni verilmedi." : "Galeri izni verilmedi." }));
    } else if (result.status === "picked") {
      setAdded((list) => [...list, ...result.photos].slice(0, MAX_REVIEW_PHOTOS - keptExisting.length));
    }
  };

  const choosePhotoSource = () =>
    Alert.alert("Fotoğraf ekle", undefined, [
      { text: "Kamera", onPress: () => addPhotos("camera") },
      { text: "Galeri", onPress: () => addPhotos("library") },
      { text: "Vazgeç", style: "cancel" },
    ]);

  const submit = async () => {
    if (!id || submitting) return;
    const found = validateReview({ rating, title, comment });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    const input = { rating, title: title.trim() || null, comment: comment.trim() };
    let review: Review;
    try {
      review = saved ? await services.reviews.update(saved.id, input) : await services.reviews.create(id, input);
      setSaved(review);
    } catch (e) {
      const info = describeError(e, "Yorum kaydedilemedi. Lütfen tekrar dene.");
      setErrors({ form: info.code === "REVIEW_EXISTS" ? "Bu ürüne zaten bir yorumun var; sayfayı yenileyip onu düzenleyebilirsin." : info.message });
      setSubmitting(false);
      if (info.code === "REVIEW_EXISTS") {
        initialized.current = false;
        mine.reload();
      }
      return;
    }

    // Yorum kaydedildi; fotograf degisiklikleri ayri istekler. Basarisiz olanlar formda kalir, tekrar denenebilir.
    const failedRemovals: string[] = [];
    for (const imageId of removed) {
      try {
        await services.reviews.removeImage(review.id, imageId);
      } catch {
        failedRemovals.push(imageId);
      }
    }
    const uploaded: ReviewImage[] = [];
    const failedUploads: PickedPhoto[] = [];
    let uploadError: string | null = null;
    for (const [index, photo] of added.entries()) {
      try {
        const prepared = await prepareReviewPhoto(photo, keptExisting.length + index);
        uploaded.push(await services.reviews.addImage(review.id, prepared));
      } catch (e) {
        failedUploads.push(photo);
        uploadError = describeError(e, "Fotoğraf yüklenemedi.").message;
      }
    }
    invalidateProductReviews(id);
    setSubmitting(false);

    if (failedRemovals.length === 0 && failedUploads.length === 0) {
      router.back();
      return;
    }
    setExisting((list) => [...list.filter((i) => !removed.includes(i.id) || failedRemovals.includes(i.id)), ...uploaded]);
    setRemoved(failedRemovals);
    setAdded(failedUploads);
    setErrors({
      form:
        failedUploads.length > 0
          ? `Yorumun kaydedildi ancak ${failedUploads.length} fotoğraf yüklenemedi: ${uploadError} Tekrar denemek için kaydet'e dokun.`
          : "Yorumun kaydedildi ancak bazı fotoğraflar kaldırılamadı. Tekrar dene.",
    });
  };

  const confirmDelete = () => {
    if (!saved || !id) return;
    Alert.alert("Yorumu sil", "Yorumun ve fotoğrafları kalıcı olarak silinsin mi?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await services.reviews.remove(saved.id);
            invalidateProductReviews(id);
            router.back();
          } catch (e) {
            setErrors({ form: describeError(e, "Yorum silinemedi. Lütfen tekrar dene.").message });
          }
        },
      },
    ]);
  };

  if (!id) {
    return (
      <StoreScreenShell title="Yorum yaz">
        <EmptyState icon="alert-circle-outline" title="Ürün bulunamadı" />
      </StoreScreenShell>
    );
  }

  if (mine.isLoading && !initialized.current) {
    return (
      <StoreScreenShell title="Yorum yaz">
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </StoreScreenShell>
    );
  }

  if (mine.error && !initialized.current) {
    return (
      <StoreScreenShell title="Yorum yaz">
        <EmptyState icon="cloud-offline-outline" title="Yorum bilgisi yüklenemedi" message={mine.error} actionLabel="Tekrar dene" onAction={mine.reload} />
      </StoreScreenShell>
    );
  }

  const footer = (
    <Pressable
      testID="review-submit"
      onPress={submit}
      disabled={submitting}
      accessibilityRole="button"
      accessibilityState={{ disabled: submitting, busy: submitting }}
      style={[styles.cta, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
    >
      {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.ctaLabel}>{editing ? "Değişiklikleri kaydet" : "Yorumu gönder"}</Text>}
    </Pressable>
  );

  return (
    <StoreScreenShell
      title={editing ? "Yorumunu düzenle" : "Yorum yaz"}
      subtitle={product?.name}
      footer={footer}
      testID="write-review-screen"
      right={
        editing ? (
          <Pressable onPress={confirmDelete} hitSlop={8} accessibilityRole="button" accessibilityLabel="Yorumu sil" testID="write-review-delete" style={[styles.headerButton, { backgroundColor: colors.inputBackground }]}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        ) : undefined
      }
    >
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Ürünü nasıl buldun?</Text>
            <RatingInput value={rating} onChange={(n) => { setRating(n); setErrors((e) => ({ ...e, rating: undefined })); }} showError={Boolean(errors.rating)} />
          </View>

          {saved?.status === "hidden" ? (
            <View style={[styles.info, { backgroundColor: colors.dangerBackground }]} testID="write-review-hidden">
              <Ionicons name="eye-off-outline" size={16} color={colors.danger} />
              <Text style={[styles.infoText, { color: colors.danger }]}>Yorumun moderasyon nedeniyle gizlendi. Düzenlemen kaydedilir ancak yeniden yayına alınması moderasyon kararına bağlıdır.</Text>
            </View>
          ) : summary?.hasVerifiedPurchase ? (
            <View style={[styles.info, { backgroundColor: colors.cardActive }]} testID="write-review-verified">
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>Bu ürünü satın aldığın için yorumun “Onaylı alışveriş” rozetiyle görünecek.</Text>
            </View>
          ) : null}

          <Text style={[styles.label, { color: colors.text }]}>Başlık (isteğe bağlı)</Text>
          <TextInput
            testID="review-title"
            value={title}
            onChangeText={setTitle}
            maxLength={MAX_TITLE_LENGTH}
            placeholder="Örn. Tadı ve çözünürlüğü çok iyi"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: errors.title ? colors.danger : colors.border }]}
          />
          {errors.title ? <Text style={[styles.error, { color: colors.danger }]}>{errors.title}</Text> : null}

          <Text style={[styles.label, { color: colors.text }]}>Yorumun</Text>
          <TextInput
            testID="review-comment-input"
            value={comment}
            onChangeText={(v) => { setComment(v); if (errors.comment) setErrors((e) => ({ ...e, comment: undefined })); }}
            maxLength={MAX_COMMENT_LENGTH}
            multiline
            placeholder="Ürünü kullanırken neler deneyimledin? Diğer kullanıcılara yardımcı ol."
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, styles.textarea, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: errors.comment ? colors.danger : colors.border }]}
          />
          <View style={styles.counterRow}>
            <Text style={[styles.error, { color: colors.danger }]}>{errors.comment ?? ""}</Text>
            <Text style={[styles.counter, { color: commentLength < MIN_COMMENT_LENGTH ? colors.textSecondary : colors.primary }]} testID="review-comment-counter">
              {commentLength}/{MAX_COMMENT_LENGTH}
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>
            Fotoğraflar <Text style={{ color: colors.textSecondary, fontWeight: "500" }}>({photoCount}/{MAX_REVIEW_PHOTOS})</Text>
          </Text>
          <View style={styles.photos}>
            {keptExisting.map((image) => (
              <PhotoTile key={image.id} uri={image.url} onRemove={() => setRemoved((r) => [...r, image.id])} testID={`existing-photo-${image.id}`} />
            ))}
            {added.map((photo, i) => (
              <PhotoTile key={`${photo.uri}-${i}`} uri={photo.uri} onRemove={() => setAdded((list) => list.filter((_, j) => j !== i))} testID={`new-photo-${i}`} />
            ))}
            {remaining > 0 ? (
              <Pressable
                onPress={choosePhotoSource}
                accessibilityRole="button"
                accessibilityLabel="Fotoğraf ekle"
                testID="review-add-photo"
                style={[styles.addTile, { borderColor: colors.primary, backgroundColor: colors.cardActive }]}
              >
                <Ionicons name="camera-outline" size={22} color={colors.primary} />
                <Text style={[styles.addLabel, { color: colors.primary }]}>Ekle</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>JPEG, PNG veya WebP; fotoğraflar yüklenmeden önce küçültülür, konum bilgisi silinir.</Text>

          {errors.form ? (
            <View style={[styles.info, { backgroundColor: colors.dangerBackground }]} testID="write-review-error">
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={[styles.infoText, { color: colors.danger }]}>{errors.form}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </StoreScreenShell>
  );
}

function PhotoTile({ uri, onRemove, testID }: { uri: string; onRemove: () => void; testID: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.tile} testID={testID}>
      <Image source={{ uri }} style={[styles.tileImage, { backgroundColor: colors.inputBackground }]} contentFit="cover" />
      <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel="Fotoğrafı kaldır" testID={`${testID}-remove`} style={styles.remove}>
        <Ionicons name="close" size={14} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: { marginTop: 48 },
  content: { paddingHorizontal: GUTTER, paddingBottom: 32, gap: 8 },
  headerButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 18, alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  info: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 14, marginTop: 6, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  label: { fontSize: 14, fontWeight: "700", marginTop: 14 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { minHeight: 140, textAlignVertical: "top" },
  counterRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  counter: { fontSize: 12, fontWeight: "600" },
  error: { flex: 1, fontSize: 12, fontWeight: "600" },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: 76, height: 76 },
  tileImage: { width: 76, height: 76, borderRadius: 14 },
  remove: { position: "absolute", top: -6, right: -6, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.72)" },
  addTile: { width: 76, height: 76, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 2 },
  addLabel: { fontSize: 12, fontWeight: "700" },
  hint: { fontSize: 12, lineHeight: 17 },
  cta: { height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  ctaLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
