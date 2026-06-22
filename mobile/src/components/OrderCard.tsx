import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Venta } from "../types";
import { colors } from "../constants/colors";
import { formatMoney, formatDate, estadoLabel } from "../utils/format";

interface Props {
  venta: Venta;
  expanded: boolean;
  onToggle: () => void;
}

export default function OrderCard({ venta, expanded, onToggle }: Props) {
  const color = colors.estado[venta.estado] ?? colors.textMuted;

  return (
    <TouchableOpacity style={styles.card} onPress={onToggle} activeOpacity={0.85}>
      <View style={styles.header}>
        <View>
          <Text style={styles.code}>Pedido #{venta.id_venta}</Text>
          <Text style={styles.date}>{formatDate(venta.fecha_venta)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: color + "22" }]}>
          <Text style={[styles.badgeText, { color }]}>
            {estadoLabel(venta.estado)}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.itemsCount}>
          {venta.detalles.length} producto{venta.detalles.length !== 1 ? "s" : ""}
        </Text>
        <Text style={styles.total}>{formatMoney(venta.total)}</Text>
      </View>

      {expanded ? (
        <View style={styles.details}>
          {venta.detalles.map((d) => (
            <View key={d.id_detalle_venta} style={styles.detailRow}>
              <Text style={styles.detailQty}>{d.cantidad}×</Text>
              <Text style={styles.detailName} numberOfLines={1}>
                {d.producto_nombre}
              </Text>
              <Text style={styles.detailSub}>{formatMoney(d.subtotal)}</Text>
            </View>
          ))}
          {venta.factura_numero ? (
            <Text style={styles.factura}>
              Factura: {venta.factura_numero}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.expandHint}>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  code: { fontSize: 15, fontWeight: "700", color: colors.text },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  itemsCount: { color: colors.textMuted, fontSize: 13 },
  total: { fontSize: 17, fontWeight: "800", color: colors.primary },
  details: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailQty: { color: colors.primary, fontWeight: "700", width: 30 },
  detailName: { flex: 1, color: colors.text },
  detailSub: { color: colors.textMuted, fontWeight: "600" },
  factura: { marginTop: 6, color: colors.textMuted, fontSize: 12 },
  expandHint: { alignItems: "center", marginTop: 6 },
});
