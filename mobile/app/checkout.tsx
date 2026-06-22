import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useCart } from "../src/context/CartContext";
import { ventasApi } from "../src/api/ventas";
import { apiErrorMessage } from "../src/api/client";
import { colors } from "../src/constants/colors";
import { formatMoney } from "../src/utils/format";
import { notifyPedidoConfirmado } from "../src/utils/notifications";
import type { MetodoPago, Venta } from "../src/types";

const METODOS: { value: MetodoPago; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "farmacia", label: "Pago en farmacia", icon: "storefront-outline" },
  { value: "qr", label: "Pago con QR", icon: "qr-code-outline" },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, total, count, clear } = useCart();

  const [metodo, setMetodo] = useState<MetodoPago>("farmacia");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Venta | null>(null);

  const confirmar = async () => {
    setError(null);
    setLoading(true);
    try {
      const venta = await ventasApi.checkout({
        items: items.map((i) => ({
          producto: i.producto.id_producto,
          cantidad: i.cantidad,
        })),
        metodo_pago: metodo,
      });
      await notifyPedidoConfirmado(venta.id_venta, formatMoney(venta.total));
      clear();
      setDone(venta);
    } catch (e) {
      setError(apiErrorMessage(e, "No se pudo confirmar el pedido."));
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de éxito
  if (done) {
    return (
      <View style={styles.successWrap}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={48} color={colors.textInverse} />
        </View>
        <Text style={styles.successTitle}>¡Pedido confirmado!</Text>
        <Text style={styles.successCode}>Pedido #{done.id_venta}</Text>
        <View style={styles.successCard}>
          <Row label="Estado" value={done.estado} />
          <Row label="Total" value={formatMoney(done.total)} />
          <Row
            label="Método de pago"
            value={done.pago?.metodo_pago ?? metodo}
          />
        </View>
        <Text style={styles.note}>
          Te enviamos una notificación con el detalle. Puedes ver el pedido en
          "Mis Pedidos".
        </Text>
        <View style={styles.successActions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace("/(tabs)/pedidos")}
          >
            <Text style={styles.primaryBtnText}>Ver mis pedidos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.ghostBtnText}>Seguir comprando</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Resumen del pedido */}
        <Text style={styles.section}>Resumen del pedido</Text>
        <View style={styles.card}>
          {items.map((i) => (
            <View key={i.producto.id_producto} style={styles.line}>
              <Text style={styles.lineQty}>{i.cantidad}×</Text>
              <Text style={styles.lineName} numberOfLines={1}>
                {i.producto.nombre}
              </Text>
              <Text style={styles.linePrice}>
                {formatMoney(
                  Number(i.producto.precio_venta ?? 0) * i.cantidad
                )}
              </Text>
            </View>
          ))}
        </View>

        {/* Método de pago */}
        <Text style={styles.section}>Método de pago</Text>
        <View style={{ gap: 10 }}>
          {METODOS.map((m) => {
            const active = metodo === m.value;
            return (
              <TouchableOpacity
                key={m.value}
                style={[styles.method, active && styles.methodActive]}
                onPress={() => setMetodo(m.value)}
              >
                <Ionicons
                  name={m.icon}
                  size={22}
                  color={active ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.methodLabel, active && styles.methodLabelActive]}>
                  {m.label}
                </Text>
                <Ionicons
                  name={active ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={active ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer fijo */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total ({count} ítems)</Text>
          <Text style={styles.totalValue}>{formatMoney(total)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
          onPress={confirmar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <>
              <Ionicons name="bag-check" size={20} color={colors.textInverse} />
              <Text style={styles.confirmText}>Confirmar pedido</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  section: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginTop: 18,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  line: { flexDirection: "row", alignItems: "center", gap: 8 },
  lineQty: { fontWeight: "700", color: colors.primary, width: 32 },
  lineName: { flex: 1, color: colors.text },
  linePrice: { fontWeight: "600", color: colors.text },
  method: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodActive: { borderColor: colors.primary, backgroundColor: "#EEF2FB" },
  methodLabel: { flex: 1, fontSize: 15, color: colors.textMuted, fontWeight: "600" },
  methodLabelActive: { color: colors.primary },
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
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: { color: colors.textMuted },
  totalValue: { fontSize: 22, fontWeight: "800", color: colors.primary },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 15,
    borderRadius: 12,
  },
  confirmText: { color: colors.textInverse, fontSize: 16, fontWeight: "700" },
  error: {
    backgroundColor: "#FEE2E2",
    color: colors.danger,
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
  },
  // Éxito
  successWrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginTop: 18,
  },
  successCode: { fontSize: 16, color: colors.primary, fontWeight: "700", marginTop: 4 },
  successCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  rowLabel: { color: colors.textMuted },
  rowValue: { color: colors.text, fontWeight: "700", textTransform: "capitalize" },
  note: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 16,
    fontSize: 13,
  },
  successActions: { width: "100%", marginTop: 24, gap: 10 },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: colors.textInverse, fontWeight: "700", fontSize: 15 },
  ghostBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  ghostBtnText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
});
