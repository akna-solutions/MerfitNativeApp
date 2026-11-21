import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../../shared/theme/ThemeContext";
import { formatDate } from "../labels";
import { describeError, useStore } from "../../state/StoreContext";
import { Review, ReviewImage } from "../../types";
import { RatingStars } from "./RatingStars";

const COLLAPSE_AT = 280;

type Props = {
  review: Review;
  onOpenPhotos: (images: ReviewImage[], index: number) => void;
  /** Baskasinin yorumu: bildir. */
  onReport?: (review: Review) => void;
  /** Kendi yorumu: duzenle / sil. */
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  testID?: string;
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toLocaleUpperCase("tr-TR"))
      .join("") || "M"
  );
}

function Avatar({ name, uri }: { name: string; uri: string | null }) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  if (uri && !failed) {
    return <Image source={{ uri }} style={styles.avatar} onError={() => setFailed(true)} accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={[styles.avatar, { backgroundColor: colors.cardActive }]}>
      <Text style={[styles.avatarText, { color: colors.primary }]}>{initials(name)}</Text>
    </View>
  );
}

/** Yorum karti. Metin duz metin olarak cizilir (HTML yorumlanmaz). Oy sayilari sunucunun yanitindan guncellenir. */
export function ReviewCard({ review, onOpenPhotos, onReport, onEdit, onDelete, testID }: Props) {
  const { colors } = useTheme();
  const { services } = useStore();
  const [vote, setVote] = useState({ helpful: review.helpfulCount, notHelpful: review.notHelpfulCount, mine: review.myVote });
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setVote({ helpful: review.helpfulCount, notHelpful: review.notHelpfulCount, mine: review.myVote });
  }, [review.helpfulCount, review.notHelpfulCount, review.myVote]);

  const castVote = async (isHelpful: boolean) => {
    if (voting || review.isMine) return;
    setVoting(true);
    setVoteError(null);
    try {
      // Ayni oya tekrar basmak oyu geri alir.
      const result = await services.reviews.vote(review.id, vote.mine === isHelpful ? null : isHelpful);
      setVote({ helpful: result.helpfulCount, notHelpful: result.notHelpfulCount, mine: result.myVote });
    } catch (e) {
      setVoteError(describeError(e, "Oyun kaydedilemedi.").message);
    } finally {
      setVoting(false);
    }
  };

  const long = review.comment.length > COLLAPSE_AT;
  const edited = review.editedAt ? " · düzenlendi" : "";

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID={testID ?? `review-${review.id}`}>
      {review.isMine && review.status === "hidden" ? (
        <View style={[styles.notice, { backgroundColor: colors.dangerBackground }]} testID="review-hidden-notice">
          <Ionicons name="eye-off-outline" size={14} color={colors.danger} />
          <Text style={[styles.noticeText, { color: colors.danger }]}>Bu yorum moderasyon nedeniyle gizlendi; yalnızca sen görüyorsun.</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <Avatar name={review.authorName} uri={review.authorAvatar} />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {review.authorName}
            </Text>
            {review.isMine ? <Text style={[styles.mine, { color: colors.primary }]}>Senin yorumun</Text> : null}
          </View>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formatDate(review.createdAt)}
            {edited}
          </Text>
        </View>
        {review.isMine && (onEdit || onDelete) ? (
          <View style={styles.ownActions}>
            {onEdit ? (
              <Pressable onPress={() => onEdit(review)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Yorumu düzenle" testID="review-edit" style={styles.iconButton}>
                <Ionicons name="create-outline" size={18} color={colors.text} />
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable onPress={() => onDelete(review)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Yorumu sil" testID="review-delete" style={styles.iconButton}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.ratingRow}>
        <RatingStars value={review.rating} size={14} />
        {review.isVerifiedPurchase ? (
          <View style={[styles.badge, { backgroundColor: colors.cardActive }]} testID="verified-badge">
            <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>Onaylı alışveriş</Text>
          </View>
        ) : null}
      </View>

      {review.title ? <Text style={[styles.title, { color: colors.text }]}>{review.title}</Text> : null}
      <Text style={[styles.comment, { color: colors.textSecondary }]} numberOfLines={long && !expanded ? 5 : undefined} testID="review-comment">
        {review.comment}
      </Text>
      {long ? (
        <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={6} accessibilityRole="button">
          <Text style={[styles.more, { color: colors.primary }]}>{expanded ? "Daha az göster" : "Devamını oku"}</Text>
        </Pressable>
      ) : null}

      {review.images.length > 0 ? (
        <View style={styles.photos}>
          {review.images.map((image, index) => (
            <Pressable
              key={image.id}
              onPress={() => onOpenPhotos(review.images, index)}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Fotoğraf ${index + 1} / ${review.images.length}`}
              testID={`review-photo-${index}`}
            >
              <Image source={{ uri: image.url }} style={[styles.photo, { backgroundColor: colors.inputBackground }]} contentFit="cover" />
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {review.isMine ? (
          <Text style={[styles.footerMeta, { color: colors.textSecondary }]}>
            {vote.helpful} kişi faydalı buldu
          </Text>
        ) : (
          <>
            <Text style={[styles.footerMeta, { color: colors.textSecondary }]}>Faydalı mı?</Text>
            <VoteButton icon="thumbs-up" label="Evet" count={vote.helpful} active={vote.mine === true} disabled={voting} onPress={() => castVote(true)} testID="vote-helpful" />
            <VoteButton icon="thumbs-down" label="Hayır" count={vote.notHelpful} active={vote.mine === false} disabled={voting} onPress={() => castVote(false)} testID="vote-not-helpful" />
            {voting ? <ActivityIndicator size="small" color={colors.primary} /> : null}
            <View style={styles.flex} />
            {onReport ? (
              review.reportedByMe ? (
                <Text style={[styles.footerMeta, { color: colors.textSecondary }]}>Bildirildi</Text>
              ) : (
                <Pressable onPress={() => onReport(review)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Yorumu bildir" testID="review-report" style={styles.iconButton}>
                  <Ionicons name="flag-outline" size={16} color={colors.textSecondary} />
                </Pressable>
              )
            ) : null}
          </>
        )}
      </View>
      {voteError ? <Text style={[styles.voteError, { color: colors.danger }]}>{voteError}</Text> : null}
    </View>
  );
}

function VoteButton(props: { icon: "thumbs-up" | "thumbs-down"; label: string; count: number; active: boolean; disabled: boolean; onPress: () => void; testID: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      testID={props.testID}
      accessibilityRole="button"
      accessibilityLabel={`${props.label}, ${props.count}`}
      accessibilityState={{ selected: props.active, disabled: props.disabled }}
      style={[styles.vote, { borderColor: props.active ? colors.primary : colors.border, backgroundColor: props.active ? colors.cardActive : "transparent" }]}
    >
      <Ionicons name={props.active ? props.icon : `${props.icon}-outline`} size={14} color={props.active ? colors.primary : colors.text} />
      <Text style={[styles.voteText, { color: props.active ? colors.primary : colors.text }]}>{props.count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 8 },
  flex: { flex: 1 },
  notice: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 10 },
  noticeText: { flex: 1, fontSize: 12, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarText: { fontSize: 14, fontWeight: "800" },
  headerText: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 14, fontWeight: "700", flexShrink: 1 },
  mine: { fontSize: 11, fontWeight: "700" },
  date: { fontSize: 12, marginTop: 1 },
  ownActions: { flexDirection: "row", gap: 4 },
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  title: { fontSize: 15, fontWeight: "700" },
  comment: { fontSize: 14, lineHeight: 21 },
  more: { fontSize: 13, fontWeight: "700" },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  photo: { width: 72, height: 72, borderRadius: 12 },
  footer: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, marginTop: 2 },
  footerMeta: { fontSize: 12, fontWeight: "600" },
  vote: { flexDirection: "row", alignItems: "center", gap: 5, height: 32, paddingHorizontal: 11, borderRadius: 16, borderWidth: 1 },
  voteText: { fontSize: 12, fontWeight: "700" },
  voteError: { fontSize: 12, fontWeight: "600" },
});
