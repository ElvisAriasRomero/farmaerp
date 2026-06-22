import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { productosApi } from "../../src/api/productos";
import { apiErrorMessage } from "../../src/api/client";
import { useCart } from "../../src/context/CartContext";
import { colors } from "../../src/constants/colors";
import { formatMoney, formatDate } from "../../src/utils/format";
import { resolveMediaUrl } from "../../src/config";
import type { Producto } from "../../src/types";
import EmptyState from "../../src/components/EmptyState";

export default function ProductoDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const p = await productosApi.detalle(Number(id));
        setProducto(p);
      } catch (e) {
        setError(apiErrorMessage(e, "No se pudo cargar el producto."));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !producto) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Producto no disponible"
        subtitle={error ?? undefined}
      />
    );
  }

  const img = resolveMediaUrl(producto.foto);
  const sinStock = producto.stock_actual <= 0;

  const onAdd = () => {
    addItem(producto, cantidad);
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.imgWrap}>
          {img ? (
            <Image source={img} style={styles.img} contentFit="cover" />
          ) : (
            <Ionicons name="medkit-outline" size={80} color={colors.textMuted} />
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.cat}>{producto.categoria_nombre}</Text>
          <Text style={styles.name}>{producto.nombre}</Text>
          <Text style={styles.price}>{formatMoney(producto.precio_venta)}</Text>

          <View
            style={[
              styles.stockBadge,
              { backgroundColor: sinStock ? "#FEE2E2" : "#DCFCE7" },
            ]}
          >
            <Ionicons
              name={sinStock ? "close-circle" : "checkmark-circle"}
              size={16}
              color={sinStock ? colors.danger : colors.success}
            />
            <Text
              style={[
                styles.stockText,
                { color: sinStock ? colors.danger : colors.success },
              ]}
            >
              {sinStock
                ? "Sin stock"
                : `${producto.stock_actual} disponibles`}
            </Text>
          </View>

          <View style={styles.info}>
            <InfoRow label="Unidad de medida" value={producto.unidad_medida ?? "—"} />
            <InfoRow
              label="Código de barras"
              value={producto.codigo_barras ?? "—"}
            />
            <InfoRow
              label="Vencimiento"
              value={
                producto.fecha_vencimiento
                  ? formatDate(producto.fecha_vencimiento)
                  : "—"
              }
            />
          </View>

          {/* Selector de cantidad */}
          {!sinStock ? (
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Cantidad</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setCantidad((c) => Math.max(1, c - 1))}
                >
                  <Ionicons name="remove" size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{cantidad}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() =>
                    setCantidad((c) =>
                      Math.min(producto.stock_actual, c + 1)
                    )
                  }
                >
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Botón fijo agregar al carrito */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addBtn, sinStock && styles.addBtnDisabled]}
          onPress={onAdd}
          disabled={sinStock}
        >
          <Ionicons name="cart" size={20} color={colors.textInverse} />
          <Text style={styles.addBtnText}>
            {sinStock ? "Sin stock" : "Agregar al carrito"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  imgWrap: {
    height: 240,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  img: { width: "100%", height: "100%" },
  body: { padding: 18, gap: 6 },
  cat: { color: colors.accent, fontWeight: "700", fontSize: 13 },
  name: { fontSize: 22, fontWeight: "800", color: colors.text },
  price: { fontSize: 24, fontWeight: "800", color: colors.primary, marginTop: 4 },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  stockText: { fontWeight: "700", fontSize: 13 },
  info: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: { color: colors.textMuted },
  infoValue: { color: colors.text, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
  },
  qtyLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtn: { padding: 6 },
  qtyValue: { fontSize: 18, fontWeight: "700", minWidth: 28, textAlign: "center" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 15,
    borderRadius: 12,
  },
  addBtnDisabled: { backgroundColor: colors.border },
  addBtnText: { color: colors.textInverse, fontSize: 16, fontWeight: "700" },
});
