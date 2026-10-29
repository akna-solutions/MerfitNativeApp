import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { DumbbellSpinner } from "../../../../shared/motion/DumbbellSpinner";

import { useTheme } from "../../../../shared/theme/ThemeContext";

export type CapturedPhoto = { uri: string; width: number; height: number };

type Props = {
  /** Cekilen fotograf; ekran tekrar acilana kadar ikinci cekim yapilmaz. */
  onCaptured: (photo: CapturedPhoto) => void;
  onCancel: () => void;
};

/** Barkod okuyucudaki gibi pencere icinde kucuk kamera: tabagi cerceveye alip deklansore basilir. */
export function FoodPhotoCamera({ onCaptured, onCancel }: Props) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isReady, setIsReady] = useState(false);
  const [isTaking, setIsTaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTake = async () => {
    if (!cameraRef.current || !isReady || isTaking) return;
    setIsTaking(true);
    setError(null);
    try {
      // Kalite burada degil, yuklemeden once yeniden boyutlandirmada dusurulur.
      const picture = await cameraRef.current.takePictureAsync({ quality: 1, exif: false, base64: false });
      onCaptured({ uri: picture.uri, width: picture.width, height: picture.height });
    } catch {
      setError("Fotoğraf çekilemedi. Lütfen tekrar deneyin.");
      setIsTaking(false);
    }
  };

  if (!permission) {
    return <DumbbellSpinner color={colors.primary} style={styles.loading} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionBox} testID="food-camera-permission">
        <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
        <Text style={[styles.permissionText, { color: colors.text }]}>Fotoğraf çekmek için kamera izni gerekiyor.</Text>
        <Pressable
          onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.primaryButtonLabel}>{permission.canAskAgain ? "Kameraya izin ver" : "Ayarları aç"}</Text>
        </Pressable>
        <Pressable onPress={onCancel} hitSlop={8}>
          <Text style={[styles.linkLabel, { color: colors.textSecondary }]}>Vazgeç</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.cameraFrame}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          mode="picture"
          onCameraReady={() => setIsReady(true)}
        />
        <View pointerEvents="none" style={styles.overlay}>
          <View style={styles.targetBox} />
        </View>
      </View>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Tabağın tamamını çerçeveye al; yukarıdan ve iyi ışıkta çek.
      </Text>
      {error ? <Text style={[styles.hint, { color: colors.danger }]}>{error}</Text> : null}
      <Pressable
        onPress={handleTake}
        disabled={!isReady || isTaking}
        testID="food-camera-shutter"
        accessibilityRole="button"
        accessibilityLabel="Fotoğraf çek"
        style={[styles.shutter, { borderColor: colors.primary, opacity: isReady && !isTaking ? 1 : 0.5 }]}
      >
        {isTaking ? <DumbbellSpinner color={colors.primary} /> : <View style={[styles.shutterInner, { backgroundColor: colors.primary }]} />}
      </Pressable>
      <Pressable onPress={onCancel} hitSlop={8} style={styles.cancelRow}>
        <Text style={[styles.linkLabel, { color: colors.primary }]}>Vazgeç</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 32 },
  permissionBox: { alignItems: "center", gap: 14, paddingVertical: 28 },
  permissionText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  primaryButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  primaryButtonLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  linkLabel: { fontSize: 13, fontWeight: "600" },
  cameraFrame: {
    marginTop: 16,
    height: 300,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  targetBox: {
    width: "82%",
    height: "78%",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
  },
  hint: { fontSize: 12, textAlign: "center", marginTop: 12 },
  shutter: {
    alignSelf: "center",
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  shutterInner: { width: 52, height: 52, borderRadius: 26 },
  cancelRow: { alignSelf: "center", paddingVertical: 14 },
});
