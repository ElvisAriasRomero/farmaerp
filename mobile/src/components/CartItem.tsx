import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { CartItem as CartItemType } from "../types";
import { colors } from "../constants/colors";
import { formatMoney } from "../utils/format";
import { resolveMediaUrl } from "../config";

interface Props {
  item: CartItemType;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}

export default function CartItem({ item, onInc, onDec, onRemove }: Props) {
  const img = resolveMediaUrl(item.producto.foto);
  const subtotal = Number(item.producto.precio_venta ?? 0) * item.cantidad;

  return (
    <View style={styles.row}>
      <View style={styles.imgWrap}>
        {img ? (
          <Image source={img} style={styles.img} contentFit="cover" />
        ) : (
          <Ionicons name="medkit-outline" size={28} color={colors.textMuted} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.producto.nombre}
        </Text>
        <Text style={styles.unit}>
          {formatMoney(item.producto.precio_venta)} c/u
        </Text>
        <Text style={styles.subtotal}>{formatMoney(subtotal)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onRemove} hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
        <View style={styles.stepper}>
          <TouchableOpacity style={styles.stepBtn} onPress={onDec}>
            <Ionicons name="remove" size={18} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.qty}>{item.cantidad}</Text>
          <TouchableOpacity style={styles.stepBtn} onPress={onInc}>
            <Ionicons name="add" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imgWrap: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  img: { width: "100%", height: "100%" },
  info: { flex: 1, justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "600", color: colors.text },
  unit: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  subtotal: { fontSize: 15, fontWeight: "800", color: colors.primary, marginTop: 4 },
  actions: { justifyContent: "space-between", alignItems: "flex-end" },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.bg,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  stepBtn: { padding: 4 },
  qty: { fontSize: 15, fontWeight: "700", minWidth: 20, textAlign: "center" },
});
