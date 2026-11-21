import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { FlatList, Modal, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ReviewImage } from "../../types";

type Props = { images: ReviewImage[]; startIndex: number | null; onClose: () => void };

/** Tam ekran fotograf galerisi (yatay kaydirma). Arka plan her temada siyahtir. */
export function ReviewPhotoViewer({ images, startIndex, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(startIndex ?? 0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <Modal visible={startIndex !== null} animationType="fade" onRequestClose={onClose} onShow={() => setIndex(startIndex ?? 0)} statusBarTranslucent>
      <View style={styles.root} testID="review-photo-viewer">
        <FlatList
          data={images}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          initialScrollIndex={startIndex ?? 0}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          renderItem={({ item }) => (
            <View style={{ width, height, justifyContent: "center" }}>
              <Image source={{ uri: item.url }} style={{ width, height: height * 0.8 }} contentFit="contain" accessibilityLabel="Yorum fotoğrafı" />
            </View>
          )}
        />
        <View style={[styles.top, { top: insets.top + 8 }]}>
          <Text style={styles.counter}>
            {Math.min(index + 1, images.length)} / {images.length}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Kapat" style={styles.close} testID="photo-viewer-close">
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  top: { position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  counter: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.16)" },
});
