import { Ionicons } from "@expo/vector-icons";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useRef } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { DumbbellSpinner } from "../../../../shared/motion/DumbbellSpinner";

import { useTheme } from "../../../../shared/theme/ThemeContext";

/** Market urunlerindeki barkod turleri (EAN/UPC). */
const PRODUCT_BARCODE_TYPES = ["ean13", "ean8", "upc_a", "upc_e"] as const;

type Props = {
  /** Gecerli bir barkod okununca bir kez cagrilir; ekran kapanana kadar yeni okuma yapilmaz. */
  onScanned: (barcode: string) => void;
  onCancel: () => void;
};

export function BarcodeScanner({ onScanned, onCancel }: Props) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  // Kamera ayni barkodu saniyede birkac kez bildirir; ilk okumadan sonra gelenleri yok say.
  const hasScannedRef = useRef(false);

  const handleScanned = ({ data }: BarcodeScanningResult) => {
    const code = data.trim();
    if (hasScannedRef.current || !/^\d{8,14}$/.test(code)) return;
    hasScannedRef.current = true;
    onScanned(code);
  };

  if (!permission) {
    return <DumbbellSpinner color={colors.primary} style={styles.loading} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionBox}>
        <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
        <Text style={[styles.permissionText, { color: colors.text }]}>
          Barkod okutmak için kamera izni gerekiyor.
        </Text>
        <Pressable
          onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.primaryButtonLabel}>
            {permission.canAskAgain ? "Kameraya izin ver" : "Ayarları aç"}
          </Text>
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
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: [...PRODUCT_BARCODE_TYPES] }}
          onBarcodeScanned={handleScanned}
        />
        <View pointerEvents="none" style={styles.overlay}>
          <View style={styles.targetBox} />
        </View>
      </View>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Ürünün barkodunu çerçevenin içine getirin.
      </Text>
      <Pressable onPress={onCancel} hitSlop={8} style={styles.cancelRow}>
        <Text style={[styles.linkLabel, { color: colors.primary }]}>Aramaya dön</Text>
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
    width: "78%",
    height: 120,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
  },
  hint: { fontSize: 12, textAlign: "center", marginTop: 12 },
  cancelRow: { alignSelf: "center", paddingVertical: 14 },
});
