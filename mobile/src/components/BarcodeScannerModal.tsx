import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanned: (codigo: string) => void;
}

/**
 * Modal de escaneo de código de barras (CU extra).
 * Usa expo-camera. Requiere build de desarrollo o dispositivo físico
 * (la cámara no funciona en simuladores).
 */
export default function BarcodeScannerModal({
  visible,
  onClose,
  onScanned,
}: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [handled, setHandled] = useState(false);

  const handleBarcode = ({ data }: { data: string }) => {
    if (handled) return;
    setHandled(true);
    onScanned(data);
  };

  const reset = () => setHandled(false);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onShow={reset}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Escanear código</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        {!permission ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.textInverse} />
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Ionicons name="camera-outline" size={56} color={colors.textInverse} />
            <Text style={styles.permText}>
              Necesitamos permiso para usar la cámara.
            </Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Conceder permiso</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.flex}>
            <CameraView
              style={styles.flex}
              onBarcodeScanned={handleBarcode}
              barcodeScannerSettings={{
                barcodeTypes: [
                  "ean13",
                  "ean8",
                  "code128",
                  "code39",
                  "upc_a",
                  "upc_e",
                  "qr",
                ],
              }}
            />
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.frame} />
              <Text style={styles.hint}>
                Apunta la cámara al código de barras del producto
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 18,
  },
  title: { color: colors.textInverse, fontSize: 18, fontWeight: "700" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  permText: { color: colors.textInverse, textAlign: "center", fontSize: 15 },
  permBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  permBtnText: { color: colors.textInverse, fontWeight: "700" },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  frame: {
    width: 260,
    height: 160,
    borderWidth: 3,
    borderColor: colors.accent,
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  hint: {
    color: colors.textInverse,
    marginTop: 20,
    fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
